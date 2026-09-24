#!/usr/bin/env python3
"""Make an offline demo copy of the FloofMart app for testing.

Usage:  python3 make-demo-copy.py <input.html> <output.html>

The copy runs the app's built-in demo mode (API_URL = ""), so it never talks to
the Worker or Telegram. It also:
  - skips the first-run guide so it doesn't cover the screen,
  - gives the demo cards placeholder photos (buyers never see photo-less cards),
  - adds one unpaid order so the pay row / "Cancel order" state is visible,
  - drops the Telegram SDK script and the background music.
Never deploy the output. It is for screenshots and the contrast scan only.
"""
import sys, re

src, dst = sys.argv[1], sys.argv[2]
t = open(src, encoding="utf-8").read()

def sub(a, b, label):
    global t
    if a not in t:
        sys.exit(f"make-demo-copy: could not find {label}; the app changed, update this script")
    t = t.replace(a, b, 1)

# 1. demo mode
a = t.index("const API_URL = IS_STAGING")
b = t.index(";", t.index('"https://fluffmart-api.shrimaniac.workers.dev/api"')) + 1
t = t[:a] + 'const API_URL = ""; // demo copy' + t[b:]

# 2. no first-run guide
sub("try{ if(!localStorage.getItem('fm_guide_start')) setTimeout(()=>openGuide('start'),900); }catch(e){}",
    "/* demo copy: guide skipped */", "first-run guide call")

# 3. placeholder photos + dates for the demo inventory
PH = ("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 63 88'>"
      "<rect width='63' height='88' rx='4' fill='%23c9b8d6'/><rect x='5' y='5' width='53' height='40' rx='2' fill='%23efe6f5'/></svg>")
a = t.index("const DEMO_INV = ["); b = t.index("];", a)
inv = t[a:b]
day = 86400000
inv = re.sub(r"condition:'([^']*)'\}", lambda m, c=[0]: (c.__setitem__(0, c[0]+1) or f"condition:'{m.group(1)}',image:\"{PH}\",dateAdded:Date.now()-{c[0]}*{day}}}"), inv)
t = t[:a] + inv + t[b:]

# 4. one unpaid order
sub("const DEMO_ORDERS = [\n",
    "const DEMO_ORDERS = [\n  {id:'EF9ZT4',status:'Awaiting Payment',total:108,created:new Date(Date.now()-180000).toISOString(),"
    "createdMs:Date.now()-180000,payWindowMins:10,lastUpdate:'Waiting for payment',items:[{name:'Demo card A',tier:'SIR',price:58},{name:'Demo card B',tier:'AR',price:50}]},\n",
    "DEMO_ORDERS")

# 5. no Telegram SDK / music
t = t.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', "")
t = t.replace('<source src="bgm.mp3" type="audio/mpeg">', "")

open(dst, "w", encoding="utf-8").write(t)
print("wrote", dst)
