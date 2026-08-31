# The WebMCP Challenge — Demo Video Recording Script

> **Target Duration:** 2 minutes 30 seconds (< 3:00 max rule)  
> **Format:** Screen recording with voiceover (Loom, OBS Studio, or screen capture)  
> **Audio:** Clear, confident, conversational English  
> **Resolution:** 1080p Full HD (1920x1080)  
> **Public Upload:** YouTube (Set to **Public** or **Unlisted**, copy link for Devpost)

---

## 🎬 Video Timeline & Screen Breakdown

```
0:00 ─── 0:25  Scene 1: The Problem & The Mission ($330B African Trade Credit Gap)
0:25 ─── 0:55  Scene 2: Netify Workspace & Ledger Overview (1-Click Judge Demo)
0:55 ─── 1:45  Scene 3: The Magic Moment — ChatGPT Live WebMCP Execution (Split Screen)
1:45 ─── 2:15  Scene 4: In-App WebMCP Inspector & Native Browser Tools
2:15 ─── 2:35  Scene 5: Production Architecture & Open Standard
2:35 ─── 2:45  Scene 6: Conclusion & The Future of Agent-Native Commerce
```

---

## 🎙️ Scene-by-Scene Script & Cues

### Scene 1: The Problem & The Mission (0:00 – 0:25)
- **On Screen:** 
  - Start on the Netify landing page at [https://app.netify.ng](https://app.netify.ng).
  - Scroll gently past the headline: *"AI Collections & Business Memory for African SMEs"*.
- **Voiceover:**
  > *"Hi everyone, this is Netify, built for The WebMCP Challenge.*
  >
  > *Across sub-Saharan Africa, over 80% of wholesale trade runs on credit. But it rarely happens through formal banks or credit cards—it happens through trust, handshake agreements, and thousands of informal WhatsApp messages.*
  >
  > *When promises break, business owners waste hundreds of hours chasing debts and risking customer relationships. Netify changes this by transforming the browser into an autonomous, agent-native collection partner using the WebMCP standard."*

---

### Scene 2: Netify Workspace & Ledger Overview (0:25 – 0:55)
- **On Screen:**
  - Click **"Sign In"** or go to [https://app.netify.ng/login](https://app.netify.ng/login).
  - Click the **"Fill Demo Credentials (Judges)"** button.
  - Click **"Sign In to Workspace"**.
  - Show the live collections dashboard with ₦28.4M in receivables, debtor rankings, and broken commitment history.
- **Voiceover:**
  > *"Let's sign in to the live workspace using our 1-click judge credentials.*
  >
  > *Here, Netify has aggregated our live receivables—over 28 million Naira in trade credit across wholesale distributors and FMCG buyers. We have aging buckets, delinquency risk scores, and broken WhatsApp payment promises.*
  >
  > *Instead of leaving merchants to calculate priorities manually, we expose 8 typed WebMCP tools directly to AI agents."*

---

### Scene 3: The Magic Moment — ChatGPT Live WebMCP Execution (0:55 – 1:45)
- **On Screen (Split Screen or Tab Switch):**
  - **Left Tab:** ChatGPT.
  - **Right Tab:** Netify workspace at `https://app.netify.ng`.
  - In ChatGPT, type or paste:
    > *"Browse to https://app.netify.ng/api/webmcp/execute?tool=get_collection_priority&limit=3. Tell me which customer should be followed up with first and why, then draft a reminder in Nigerian Pidgin."*
  - Watch ChatGPT execute the tool and return the live analysis for **ABC Stores**.
- **Voiceover:**
  > *"Now let's see WebMCP in action.*
  >
  > *We ask our agent: 'Who should we follow up with first and why?'*
  >
  > *Watch what happens: The agent autonomously invokes our registered `get_collection_priority` WebMCP tool.*
  >
  > *Notice that Northern Distribution owes 1.2 million Naira, but our agent correctly identifies ABC Stores as the highest priority because they missed a payment commitment and are 21 days late.*
  >
  > *The agent also drafts a culturally nuanced follow-up in Nigerian Pidgin: 'Hello ABC Stores, we dey check up on your balance...' The merchant stays in full control to review and send it to WhatsApp with one click."*

---

### Scene 4: In-App WebMCP Inspector & Native Browser Tools (1:45 – 2:15)
- **On Screen:**
  - Switch back to Netify and navigate to [https://app.netify.ng/webmcp](https://app.netify.ng/webmcp) (or click the floating **"WebMCP Engine"** badge at bottom right).
  - Show the 8 registered tools in the list.
  - Click `get_customer_evidence` and click **"Execute Tool Live"** to show instant JSON return.
  - Quick glance at Chrome DevTools Console showing `document.modelContext.getTools()`.
- **Voiceover:**
  > *"Under the hood, Netify implements the open W3C WebMCP standard on `document.modelContext.registerTool`.*
  >
  > *We've built 8 production tools spanning account discovery, debtor evidence, risk profiling, multi-language drafting, and recording new payment commitments.*
  >
  > *Judges can test every single tool live right inside our interactive inspector, or run `document.modelContext.getTools()` in Chrome DevTools with WebMCP flags enabled."*

---

### Scene 5: Production Architecture & Open Standard (2:15 – 2:35)
- **On Screen:**
  - Open [https://app.netify.ng/.well-known/webmcp.json](https://app.netify.ng/.well-known/webmcp.json) or show the GitHub repository architecture diagram.
- **Voiceover:**
  > *"This isn't a static mockup. Netify is deployed on Google Cloud Run with custom subdomains, PostgreSQL with pgvector for semantic debtor search, and Redis caching.*
  >
  > *We've also implemented the standard `/.well-known/webmcp.json` auto-discovery protocol, making Netify instantly discoverable to any autonomous crawler on the web."*

---

### Scene 6: Conclusion & The Future (2:35 – 2:45)
- **On Screen:**
  - Return to the clean Netify dashboard.
  - Show the Netify logo and GitHub link.
- **Voiceover:**
  > *"WebMCP unlocks the future of the agent-native web. With Netify, African merchants and their AI agents can now work together to turn informal promises into recovered cash.*
  >
  > *All code is open-source under the MIT license on GitHub. Thank you for watching!"*

---

## 💡 Practical Recording Tips

1. **Audio Quality:** Use a clean microphone or headset in a quiet room. Speak clearly at a moderate, upbeat pace.
2. **Browser Setup:**
   - Keep 3 tabs ready before starting:
     1. `https://app.netify.ng` (logged out, ready to log in)
     2. `https://app.netify.ng/webmcp` (inspector tab)
     3. ChatGPT tab with the prompt pre-tested.
3. **Screen Zoom:** Set browser zoom to 100% or 110% so text and numbers are sharp and legible on mobile screens.
4. **Time Limit:** If your first take is 2:50, you are golden. Do not exceed 3:00 under any circumstances.
