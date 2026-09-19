"""Headless checks for the helper's lint and tracker endpoints.

Run from the helper's venv so google-genai and flask are importable:

    cd job-scraper/helper && ./.venv/bin/python ../test/helper_test.py

OUTREACH_CSV is pointed at a temp file before the module is imported, so the real
tracker is never read or written. No Gemini call is made: draft_problems() is a pure
function and the tracker endpoints do not touch the model.
"""

import csv
import json
import os
import pathlib
import sys
import tempfile
from datetime import datetime, timedelta

HERE = pathlib.Path(__file__).resolve().parent
HELPER = HERE.parent / "helper"
REAL_CSV = HELPER / "outreach.csv"
real_existed = REAL_CSV.exists()

# .resolve() to match what server.py does to the path, so the guard below
# compares like with like (on macOS /var is a symlink to /private/var).
tmpdir = pathlib.Path(tempfile.mkdtemp(prefix="jobmatch-test-")).resolve()
TMP_CSV = tmpdir / "outreach.csv"
os.environ["OUTREACH_CSV"] = str(TMP_CSV)

sys.path.insert(0, str(HELPER))
import server  # noqa: E402

assert server.OUTREACH_CSV == TMP_CSV, "env override did not take; refusing to touch the real tracker"

passed = failed = 0


def ok(cond, msg):
    global passed, failed
    if cond:
        passed += 1
        print("  ok   " + msg)
    else:
        failed += 1
        print("  FAIL " + msg)


print("draft_problems() lint")
clean = {
    "message": (
        "Hi X,\n\nI'm an embedded engineer from PoliTo. I cut idle power 99% on an ESP32-S3 "
        "product last year, and I'm trying to work out what firmware work is really like.\n\n"
        "You moved from PCB to the BLE stack at Nordic. Any regrets? Could I ask over a short call?"
    ),
    "connection_note": "Your move from PCB to firmware is what I'm weighing. Mind if I ask you one thing?",
    "email_body": "Short body with a number, 99% idle power cut, and a question.",
    "follow_up": "Hi X, I wrote a few weeks ago. Since then I've " + server.FOLLOWUP_PLACEHOLDER + ". Still curious.",
}
ok(server.draft_problems(clean) == [], "a clean draft passes")

bad = {
    "message": "Hi X, I am keen to leverage your insights on this journey!",
    "connection_note": "Excited to connect — fellow engineer.",
    "email_body": "Happy to work around your schedule.",
    "follow_up": "Hi X, following up.",
}
problems = server.draft_problems(bad)
joined = " | ".join(problems)
ok("no numeric achievement" in joined, "catches a message with no number from the CV")
ok("placeholder" in joined, "catches a follow-up that lost the fill-in placeholder")
ok("leverage" in joined and "journey" in joined, "catches AI-tell words")
ok("exclamation" in joined, "catches an exclamation mark")
ok("dash as an aside" in joined, "catches an em dash used as an aside")

print("\ntracker endpoints")
c = server.app.test_client()
r = c.get("/outreach/coverage")
cov = r.get_json()
ok(r.status_code == 200, "GET /outreach/coverage answers on an empty tracker")
ok(set(cov["by_area"]) == set(server.AREAS), "coverage lists exactly the AREAS tuple")
ok(cov["total"] == 0 and cov["sent_today"] == 0, "empty tracker counts zero")

for name, area in [("A", "firmware-platform"), ("B", "firmware-platform"), ("C", "embedded-linux")]:
    resp = c.post("/outreach/log", json={
        "name": name, "area": area, "channel": "linkedin-dm",
        "mentor_type": "career", "url": "https://example.invalid/in/x", "company": "Example",
    })
    assert resp.status_code == 200, resp.get_data(as_text=True)

with TMP_CSV.open(newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
ok([*rows[0]] == list(server.OUTREACH_FIELDS), "logged rows use the documented column order")
due_date = (datetime.now() + timedelta(days=server.FOLLOWUP_DAYS)).strftime("%Y-%m-%d")
ok(rows[0]["followup_due"] == due_date, f"follow-up lands {server.FOLLOWUP_DAYS} days out")
ok(rows[0]["status"] == "sent", "new rows start as 'sent'")

cov = c.get("/outreach/coverage").get_json()
ok(cov["by_area"]["firmware-platform"]["contacted"] == 2, "counts two in firmware-platform")
ok(cov["by_area"]["embedded-linux"]["contacted"] == 1, "counts one in embedded-linux")
ok(cov["sent_today"] == 3, "sent_today counts today's rows for the daily cap")

rows[0]["status"] = "replied"
with TMP_CSV.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=server.OUTREACH_FIELDS)
    w.writeheader()
    w.writerows(rows)
cov = c.get("/outreach/coverage").get_json()
ok(cov["by_area"]["firmware-platform"]["replied"] == 1, "a 'replied' row is counted as replied")

far_future = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
with TMP_CSV.open("a", newline="", encoding="utf-8") as f:
    csv.DictWriter(f, fieldnames=server.OUTREACH_FIELDS).writerow(
        {"sent_at": "2026-01-01", "name": "D", "area": "made-up-tag",
         "status": "sent", "followup_due": far_future}
    )
cov = c.get("/outreach/coverage").get_json()
ok(cov["by_area"]["other"]["contacted"] == 1, "an unknown area tag falls back to 'other' instead of crashing")

ok(c.get("/outreach/due").get_json()["due"] == [], "nothing is due the day it was logged")
with TMP_CSV.open("a", newline="", encoding="utf-8") as f:
    csv.DictWriter(f, fieldnames=server.OUTREACH_FIELDS).writerow({
        "sent_at": (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d"),
        "name": "Overdue", "area": "firmware-platform", "status": "sent",
        "followup_due": (datetime.now() - timedelta(days=25)).strftime("%Y-%m-%d"),
    })
due = c.get("/outreach/due").get_json()["due"]
ok(len(due) == 1 and due[0]["name"] == "Overdue", "an overdue row shows up in the due list")

# Pinning existing behaviour: a hand-edited row that lost its date reads as due
# rather than disappearing. Losing track of a person is the worse failure.
with TMP_CSV.open("a", newline="", encoding="utf-8") as f:
    csv.DictWriter(f, fieldnames=server.OUTREACH_FIELDS).writerow(
        {"sent_at": "2026-01-01", "name": "NoDate", "status": "sent", "followup_due": ""}
    )
names = [d["name"] for d in c.get("/outreach/due").get_json()["due"]]
ok("NoDate" in names, "a row with a blank follow-up date surfaces as due, not silently dropped")

print("\n/triage — sorting a results page before any profile is opened")
r = c.post("/triage", json={"people": [{"name": "X"}]})
ok(r.status_code == 400, "a request with no CV is rejected")
r = c.post("/triage", json={"cv": "cv", "people": []})
ok(r.status_code == 400, "an empty people list is rejected")

PEOPLE = [
    {"name": "Staff Person", "headline": "Staff Firmware Engineer", "location": "Turin", "degree": "2nd"},
    {"name": "Grad Person", "headline": "Embedded Engineer", "open_to_work": True},
    {"name": "Vague Person", "headline": "Engineer"},
]
prompt = server.people_to_prompt("stuck between A and B", PEOPLE)
ok("stuck between A and B" in prompt, "the fork reaches the prompt")
ok(all(f"[{i}]" in prompt for i in range(len(PEOPLE))),
   "every card is indexed, so answers can be matched back")
ok("badge: OPEN TO WORK" in prompt, "the open-to-work badge is passed through")
ok(all(a in server.TRIAGE_INSTRUCTIONS for a in ("firmware-platform", "other")),
   "the instructions carry the same AREAS the tracker uses")


class FakeModels:
    """Stands in for Gemini: no network, no quota, a canned answer."""

    def __init__(self, payload):
        self.payload = payload
        self.calls = 0

    def generate_content(self, **kwargs):
        self.calls += 1
        return type("R", (), {"text": self.payload})()


class FakeClient:
    def __init__(self, payload):
        self.models = FakeModels(payload)


real_client = server.client
server.client = FakeClient(json.dumps({"results": [
    {"i": 0, "verdict": "draft", "score": 88, "area": "firmware-platform", "reason": "staff, Turin"},
    {"i": 1, "verdict": "skip", "score": 150, "area": "made-up", "reason": "open to work"},
    {"i": 9, "verdict": "draft", "score": 50, "area": "other", "reason": "index out of range"},
]}))
try:
    out = server.triage_people("cv", "fork", PEOPLE)
    ok(server.client.models.calls == 1, "one model call for the whole page, not one per person")
    ok(len(out) == 3, "one row back per card, none dropped")
    ok(out[0]["verdict"] == "draft" and out[0]["score"] == 88, "a good card comes back as draft")
    ok(out[0]["name"] == "Staff Person", "  with the card's own fields still attached")
    ok(out[1]["score"] == 100, "a score above 100 is clamped")
    ok(out[1]["area"] == "other", "an area the tracker does not know falls back to 'other'")
    ok(out[2]["verdict"] == "maybe", "a card the model skipped becomes 'maybe', not a disappearance")
    ok("did not rate" in out[2]["reason"], "  and says so")
finally:
    server.client = real_client

print("\nsafety")
ok(REAL_CSV.exists() == real_existed, "the real outreach.csv was neither created nor modified")

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
