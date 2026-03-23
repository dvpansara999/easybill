import type { SeoPageDefinition } from "./seoPageTypes"

export const seoPricing: SeoPageDefinition = {
  path: "/pricing",
  meta: {
    title: "Pricing | easyBILL — simple plans for growing businesses",
    description:
      "See easyBILL pricing for invoice creation, PDF export, templates, and GST-ready billing. Start free and upgrade when you need more.",
  },
  content: {
    heroEyebrow: "Transparent pricing",
    heroTitle: "Plans that match how you bill",
    heroSubtitle:
      "Whether you send a handful of invoices or run a busy shop, easyBILL keeps pricing clear—no surprise line items on your statement.",
    problemTitle: "The problems unfair pricing creates for your business",
    problems: [
      {
        title: "You discover limits only after you’ve invested time",
        text: "You’ve loaded customers, tuned templates, then export or branding is paywalled—now you’re negotiating with a spreadsheet open and a client waiting.",
      },
      {
        title: "You can’t tell which tier you actually need",
        text: "PDFs live on one plan, “pro” templates on another, and GST extras somewhere else—so you’re guessing instead of billing.",
      },
      {
        title: "A price change breaks your workflow overnight",
        text: "When the tool moves features between tiers, you lose days relearning the stack instead of serving buyers.",
      },
    ],
    solutionTitle: "How easyBILL answers those pricing pains",
    solutionLead:
      "We built easyBILL so you can start on a real free tier, run the same invoice workflow you’ll use at scale, and see plainly what unlocks when you upgrade—not after you’re stuck mid-job. Paid tiers extend limits and depth; the core loop (templates, GST lines, PDFs, sync) stays honest across the journey.",
    solutionPoints: [
      "Stop mid-job surprises: explore PDFs, branding, and the builder on free before you depend on a paywall you didn’t see coming.",
      "One workspace, clearer tiers: templates, taxes, and export live in one product story—upgrade when volume or limits match you, not because a basic step was hidden.",
      "Your workflow survives plan changes: data stays in one account as you move up; you’re not rebuilding from zero every time billing shifts.",
    ],
    featuresSectionTitle: "What every plan is built around",
    features: [
      { icon: "FileText", title: "Print-ready PDFs", desc: "Exports you can send to clients or file away for compliance." },
      { icon: "Receipt", title: "GST-aware lines", desc: "CGST, SGST, and IGST structured the way Indian invoices expect." },
      { icon: "Palette", title: "Branding", desc: "Logo and business details on documents that represent you." },
      { icon: "Cloud", title: "Cloud sync", desc: "Sign in from laptop or phone and stay on the same account." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Start free", desc: "Create an account from the home page and open your workspace in seconds." },
      { title: "Send real invoices", desc: "Use templates and catalog items until the workflow feels second nature." },
      { title: "Upgrade when it fits", desc: "Move to a paid tier when limits or features match your growth—not before." },
    ],
    faqTitle: "Pricing questions",
    faqs: [
      {
        q: "Is there a free tier?",
        points: ["Yes—start without a card and use the real builder first.", "Upgrade only when your volume needs a paid plan."],
      },
      {
        q: "Can I change plans later?",
        points: ["Switch tiers anytime as your business changes.", "Invoices and data stay in one workspace—no migration panic."],
      },
      {
        q: "Do you charge per invoice?",
        points: ["No per-download surprises—plans use subscription limits.", "You’re not taxed again every time you export a PDF."],
      },
    ],
    ctaTitle: "Ready to see the numbers in the app?",
    ctaSubtitle: "Start free on easyBILL and open pricing details inside your account when you’re ready.",
  },
}

export const seoFeatures: SeoPageDefinition = {
  path: "/features",
  meta: {
    title: "Features | easyBILL — invoices, PDFs, GST, and more",
    description:
      "Explore easyBILL features: invoice templates, GST-ready taxes, PDF download, catalog, encryption for sensitive fields, and a calm dashboard.",
  },
  content: {
    heroEyebrow: "Product tour",
    heroTitle: "Everything you need to bill with confidence",
    heroSubtitle:
      "easyBILL combines a fast editor, professional PDFs, and India-ready tax lines so you spend less time formatting and more time getting paid.",
    problemTitle: "What breaks when invoicing is scattered across tools",
    problems: [
      {
        title: "Word and spreadsheets quietly break your totals",
        text: "You nudge a row, forget a formula, or paste the wrong rate—clients see a document you don’t fully trust either.",
      },
      {
        title: "Global apps don’t speak GST or rupees the way your clients expect",
        text: "Tax lines look foreign, symbols feel wrong, and you’re manually explaining what should be obvious on the page.",
      },
      {
        title: "Nobody can find the “latest” invoice when it’s split across email and folders",
        text: "A buyer asks for a copy and you’re searching three threads instead of one place.",
      },
    ],
    solutionTitle: "How easyBILL fixes each of those failures",
    solutionLead:
      "Structured editing replaces fragile documents: line items, discounts, and taxes recalc together so you’re not the calculator. India-ready defaults carry GST and presentation your recipients recognize. One history in the dashboard means the answer to “can you resend that?” is always a click away—not a file hunt.",
    solutionPoints: [
      "Fix broken manual layouts: templates plus a single editor keep totals tied to line items—change a quantity, the bill stays consistent.",
      "Fix the India gap: CGST/SGST/IGST patterns and rupee-friendly formatting live in the same flow as PDF export, not as an afterthought.",
      "Fix scattered records: saved customers, products, and invoice history live in your workspace so support and resends don’t depend on inbox archaeology.",
    ],
    featuresSectionTitle: "Highlights teams actually use",
    features: [
      { icon: "Layers", title: "Templates", desc: "Modern, minimal, and classic looks—pick a default and move." },
      { icon: "Zap", title: "Fast catalog", desc: "Reuse products and customers instead of retyping details." },
      { icon: "Download", title: "PDF export", desc: "Download or share a file clients can open anywhere." },
      { icon: "Shield", title: "Protected fields", desc: "Extra care for data you don’t want floating around in plain text." },
      { icon: "Banknote", title: "Bank & UPI", desc: "Surface payment details so clients know exactly how to pay." },
      { icon: "BarChart3", title: "Dashboard signals", desc: "Glance at activity without digging through spreadsheets." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Set up your profile", desc: "Add business identity, tax details, and optional logo once." },
      { title: "Build the invoice", desc: "Line items, GST splits, discounts, and notes stay structured in the editor." },
      { title: "Send the PDF", desc: "Export or share a print-ready document and track it from history." },
    ],
    faqTitle: "Feature FAQs",
    faqs: [
      {
        q: "Is easyBILL only for GST?",
        points: ["Built for Indian GST workflows first.", "Flexible enough for many other billing scenarios too."],
      },
      {
        q: "Can I use it on mobile?",
        points: ["Same account on phone and desktop.", "Cloud sync—edit wherever you are."],
      },
      {
        q: "Do you store my PDFs?",
        points: ["Workspace keeps invoice data so you can re-export anytime.", "You choose what actually goes to clients."],
      },
    ],
    ctaTitle: "See the features inside your workspace",
    ctaSubtitle: "Start free and explore templates, taxes, and PDFs with your own branding.",
  },
}

export const seoGstInvoiceGenerator: SeoPageDefinition = {
  path: "/gst-invoice-generator",
  meta: {
    title: "GST Invoice Generator | Create CGST, SGST & IGST invoices | easyBILL",
    description:
      "Generate GST-compliant invoices online with easyBILL: line items, tax splits, HSN-friendly structure, and professional PDF export for Indian businesses.",
  },
  content: {
    heroEyebrow: "India • GST",
    heroTitle: "GST invoice generator built for real returns",
    heroSubtitle:
      "Structure CGST, SGST, and IGST cleanly, keep line items readable for clients, and export PDFs you’re not embarrassed to attach.",
    problemTitle: "Where GST invoicing usually goes wrong",
    problems: [
      {
        title: "Wrong split, painful reconciliation later",
        text: "Intra-state vs inter-state treatment slips once, and you’re untangling books instead of closing the month.",
      },
      {
        title: "Clients doubt totals when the PDF looks messy",
        text: "If tax columns don’t line up or labels confuse readers, even correct numbers feel unreliable.",
      },
      {
        title: "One discount forces you to redo every line by hand",
        text: "You’re afraid to change the bill because recalculating GST across items eats the evening.",
      },
    ],
    solutionTitle: "How easyBILL solves those GST headaches",
    solutionLead:
      "The editor keeps tax lines and grand totals in lockstep as you edit—so a discount or quantity change doesn’t become a manual rework. CGST, SGST, and IGST show in a layout recipients can read. Export matches what you reviewed on screen, so the PDF you send is the same structured bill you trusted before download.",
    solutionPoints: [
      "Fix split mistakes: adjust treatment in one place; totals and tax rows update together so you’re not patching cells in a spreadsheet.",
      "Fix trust on the page: consistent columns and labels mean buyers and accountants see how the bill composes—not a wall of ambiguous numbers.",
      "Fix edit fear: change items, rates, or discounts; the workspace recalculates so you’re not triple-checking arithmetic at midnight.",
    ],
    featuresSectionTitle: "Why teams pick easyBILL for GST",
    features: [
      { icon: "Receipt", title: "Tax-aware lines", desc: "CGST/SGST/IGST patterns that match common Indian invoicing." },
      { icon: "FileText", title: "Clean PDF layout", desc: "A4 output that reads well on screen and on paper." },
      { icon: "Sparkles", title: "Professional polish", desc: "Logo and typography that feel intentional, not rushed." },
      { icon: "Clock", title: "Saved history", desc: "Find past invoices when a client asks for a copy." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Enter party & items", desc: "Add customer details, line items, and tax treatment in one guided editor." },
      { title: "Review totals", desc: "Watch tax and grand totals update as you adjust quantities or discounts." },
      { title: "Download PDF", desc: "Export a file you can email, print, or upload to your records." },
    ],
    faqTitle: "GST invoice generator FAQs",
    faqs: [
      {
        q: "Is this legal tax advice?",
        points: ["No—we help you format invoices, not interpret law.", "Ask a qualified pro for compliance in your case."],
      },
      {
        q: "Can I mention HSN/SAC?",
        points: ["Add what your clients and process need in line items or notes.", "Structured fields keep it readable on the PDF."],
      },
      {
        q: "Does it work for both B2B and B2C?",
        points: ["Yes—teams use easyBILL for both.", "Tune fields and wording to each buyer type."],
      },
    ],
    ctaTitle: "Generate your next GST invoice in easyBILL",
    ctaSubtitle: "Start free—no credit card required to explore the generator.",
  },
}

export const seoFreeInvoiceGenerator: SeoPageDefinition = {
  path: "/free-invoice-generator",
  meta: {
    title: "Free Invoice Generator | Create & download invoices | easyBILL",
    description:
      "Use easyBILL as a free invoice generator: sign up, build professional invoices, and download PDFs. Upgrade only when you outgrow the free tier.",
  },
  content: {
    heroEyebrow: "Start at zero cost",
    heroTitle: "A free invoice generator that doesn’t feel like a demo",
    heroSubtitle:
      "You get a real editor, templates, and PDF export—not a watermarked teaser that forces an upgrade after one click.",
    problemTitle: "Why “free” generators often fail you",
    problems: [
      {
        title: "You finish the invoice, then export is locked",
        text: "The tool got you halfway, and now you’re forced to pay or send something unprofessional—right when the client is waiting.",
      },
      {
        title: "The PDF looks cheap, so you hesitate to send it",
        text: "If the file undermines your brand, “free” cost you credibility instead of cash.",
      },
      {
        title: "You retype the same customer every single week",
        text: "No saved parties or catalog means “free” burns hours you could spend on actual work.",
      },
    ],
    solutionTitle: "How easyBILL fixes the free-tier trap",
    solutionLead:
      "You start with a real workflow: templates, editor, and PDF export you can actually send—not a fake preview. Output stays professional so you’re not ashamed to attach it. Saved customers and items mean the second invoice is faster than the first, even before you ever upgrade.",
    solutionPoints: [
      "Fix the export bait-and-switch: build and download within the same honest free loop; upgrade only when limits—not basic dignity—ask for it.",
      "Fix embarrassing PDFs: branding and layout carry through so the document matches how you want to be seen.",
      "Fix endless retyping: store buyers and line items once, then duplicate and tweak—free time back on your side.",
    ],
    featuresSectionTitle: "What you can do on the free start",
    features: [
      { icon: "CheckCircle2", title: "Real templates", desc: "Pick a layout that matches how you want to look." },
      { icon: "Download", title: "PDF download", desc: "Attach a professional file to email or WhatsApp." },
      { icon: "Users", title: "Saved parties", desc: "Stop retyping names, GSTIN, and addresses." },
      { icon: "Zap", title: "Fast edits", desc: "Duplicate past work when the next invoice is similar." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Create your account", desc: "Sign up from the home page with email or Google—your choice." },
      { title: "Build an invoice", desc: "Add items, taxes, and notes using the full editor." },
      { title: "Download & send", desc: "Export PDF and share it like you would any business document." },
    ],
    faqTitle: "Free invoice generator FAQs",
    faqs: [
      {
        q: "Is the free tier time-limited?",
        points: ["No countdown gimmick—explore at your pace.", "Limits follow what you see in-product for your plan."],
      },
      {
        q: "Will my PDFs have watermarks?",
        points: ["Professional output—no cheesy watermarks on your brand.", "What you download should look client-ready."],
      },
      {
        q: "When should I upgrade?",
        points: ["When volume, team, or features outgrow free comfortably.", "Your history moves with you—no restart."],
      },
    ],
    ctaTitle: "Try the free invoice generator",
    ctaSubtitle: "Start free on easyBILL and send your first PDF today.",
  },
}

export const seoInvoiceGeneratorIndia: SeoPageDefinition = {
  path: "/invoice-generator-india",
  meta: {
    title: "Invoice Generator India | Rupee billing, GST & PDF | easyBILL",
    description:
      "easyBILL is an invoice generator for Indian businesses: rupee-friendly formatting, GST lines, bank/UPI details, templates, and PDF download.",
  },
  content: {
    heroEyebrow: "Built for India",
    heroTitle: "Invoice generator India teams can send with pride",
    heroSubtitle:
      "From local shops to consultancies, easyBILL respects how Indian businesses bill: clear rupee presentation, GST structure, and payment details clients understand.",
    problemTitle: "What goes wrong with foreign-first invoice tools",
    problems: [
      {
        title: "Rupee presentation feels “almost right” but not professional",
        text: "Clients notice awkward symbols or spacing—it chips away trust before they even read the total.",
      },
      {
        title: "GST doesn’t read the way Indian buyers expect",
        text: "Generic “tax” fields don’t show CGST/SGST/IGST clearly, so you explain in email what the PDF should say.",
      },
      {
        title: "Payment details live in chat instead of on the bill",
        text: "IFSC, account, and UPI should be on the document; burying them causes “how do we pay?” delays.",
      },
    ],
    solutionTitle: "How easyBILL fixes India-specific billing friction",
    solutionLead:
      "easyBILL is built around how Indian invoices are read: rupee-friendly formatting, GST lines that match common practice, and a dedicated payment block for bank and UPI—so the PDF answers questions before your client has to message you. You stop patching foreign defaults; you issue a bill that fits local expectations.",
    solutionPoints: [
      "Fix weak rupee presentation: amounts and layout read cleanly for domestic clients—no “imported” feel on something you send every week.",
      "Fix vague tax rows: structure CGST/SGST/IGST on the page so recipients and finance teams see the split they expect.",
      "Fix payment chase: put IFSC, account, and UPI where people look—fewer follow-ups, faster settlements.",
    ],
    featuresSectionTitle: "Why India-based teams choose easyBILL",
    features: [
      { icon: "Receipt", title: "GST-ready structure", desc: "Line items and tax columns that match common practice." },
      { icon: "Banknote", title: "Payment block", desc: "Surface bank and UPI details where clients look first." },
      { icon: "Smartphone", title: "Works on mobile", desc: "Issue or tweak invoices from the field." },
      { icon: "FilePenLine", title: "Terms & notes", desc: "Capture PO numbers, delivery notes, or payment terms." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Add your business", desc: "GSTIN, address, and logo once—reuse on every document." },
      { title: "Fill the bill", desc: "Line items, taxes, discounts, and customer copy in one place." },
      { title: "Share PDF", desc: "Download and send through your normal channels." },
    ],
    faqTitle: "India invoice generator FAQs",
    faqs: [
      {
        q: "Does easyBILL support rupees only?",
        points: ["Optimized for ₹ invoicing and Indian tax layout.", "Formatting matches what local clients expect."],
      },
      {
        q: "Can freelancers use it?",
        points: ["Yes—consultants, studios, and solos use it daily.", "Same flexible builder for services or goods."],
      },
      {
        q: "Is my data stored in the cloud?",
        points: ["Yes—hosted workspace, not trapped on one PC.", "Sign in anywhere; your drafts follow you."],
      },
    ],
    ctaTitle: "Start billing the Indian way",
    ctaSubtitle: "Create your free easyBILL account and open the India-ready generator.",
  },
}

export const seoCreateInvoiceOnline: SeoPageDefinition = {
  path: "/create-invoice-online",
  meta: {
    title: "Create Invoice Online | Free start, templates & PDF | easyBILL",
    description:
      "Create invoices online with easyBILL: web-based editor, saved customers and products, GST support, and instant PDF download.",
  },
  content: {
    heroEyebrow: "Web-based",
    heroTitle: "Create invoices online—without installing software",
    heroSubtitle:
      "Open easyBILL in the browser, sign in, and produce invoices from anywhere. Your workspace stays synced instead of trapped in a single laptop file.",
    problemTitle: "What hurts when invoicing is tied to one file or one machine",
    problems: [
      {
        title: "You’re never sure which file is the truth",
        text: "“Final-final-v3.pdf” and stray spreadsheets mean the wrong version goes to the client.",
      },
      {
        title: "You’re stuck when you’re not at your desk",
        text: "A buyer asks for a bill on the road, but the invoice only lives on one laptop.",
      },
      {
        title: "Copy-paste between tools creates silent errors",
        text: "Rates and names drift between the sheet and the document—then you’re apologizing for a bad total.",
      },
    ],
    solutionTitle: "How easyBILL fixes online, anywhere billing",
    solutionLead:
      "One signed-in workspace in the browser replaces scattered files: the latest draft is always the one in your account. Sync across devices means you can fix or send from the shop, home, or phone. Structured line items mean you’re not pasting numbers between apps—the editor holds the source of truth.",
    solutionPoints: [
      "Fix version chaos: single history and one canonical invoice per job—resend or edit from the same record, not from inbox attachments.",
      "Fix device lock-in: open the same account on phone or desktop; pick up mid-invoice wherever you are.",
      "Fix paste mistakes: totals follow the line items you entered—no broken bridge between spreadsheet and Word.",
    ],
    featuresSectionTitle: "What “online” unlocks",
    features: [
      { icon: "Cloud", title: "Synced drafts", desc: "Pick up mid-invoice from another device." },
      { icon: "Layers", title: "Reusable templates", desc: "Switch looks without rebuilding content." },
      { icon: "Zap", title: "Saved catalog", desc: "Products and customers on tap for repeat billing." },
      { icon: "Share2", title: "Easy handoff", desc: "Download PDF and share through email or chat instantly." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Sign in online", desc: "Use email or Google to open your workspace in the browser." },
      { title: "Compose", desc: "Add line items, taxes, and customer details with live totals." },
      { title: "Export", desc: "Download a PDF or duplicate for the next billing cycle." },
    ],
    faqTitle: "Create invoice online FAQs",
    faqs: [
      {
        q: "Do I need to install an app?",
        points: ["No install—use a current browser on desktop or phone.", "Bookmark easyBILL and you’re in."],
      },
      {
        q: "Is my connection secure?",
        points: ["Always use our official URL; protect your password.", "Traffic uses encrypted transport like you’d expect from hosted software."],
      },
      {
        q: "Can teams share access?",
        points: ["Start solo today.", "Add shared habits as the business grows—same workspace model."],
      },
    ],
    ctaTitle: "Create your next invoice online",
    ctaSubtitle: "Start free with easyBILL—your workspace opens in the browser.",
  },
}

export const seoDownloadInvoicePdf: SeoPageDefinition = {
  path: "/download-invoice-pdf",
  meta: {
    title: "Download Invoice PDF | Print-ready A4 export | easyBILL",
    description:
      "Download invoice PDFs from easyBILL: A4 layout, branding, GST lines, and a file you can email or print. Start free and export in minutes.",
  },
  content: {
    heroEyebrow: "PDF export",
    heroTitle: "Download invoice PDFs that look finished",
    heroSubtitle:
      "Clients judge professionalism fast. easyBILL generates A4 PDFs with consistent spacing, readable tax columns, and your identity on the page.",
    problemTitle: "When your PDF undermines an otherwise correct invoice",
    problems: [
      {
        title: "Broken tables make people doubt the math",
        text: "Wrapped rows and misaligned columns trigger “are these numbers real?”—even when you did the work carefully.",
      },
      {
        title: "Blurry logos and faint type look unprofessional",
        text: "Visual quality signals care; a weak export makes you look smaller than you are.",
      },
      {
        title: "You rebuild the layout in another app for every send",
        text: "Copying into Canva or Word for each client doesn’t scale—and introduces new mistakes.",
      },
    ],
    solutionTitle: "How easyBILL fixes PDF quality and workflow",
    solutionLead:
      "You design once in the editor; the PDF is generated from that same structure—no second layout pass. Tables, tax columns, and totals stay aligned for A4. Logo and branding export crisply so the file matches the business you’re building.",
    solutionPoints: [
      "Fix mistrust from layout: what you review on screen maps to the PDF—no surprise wraps or orphaned columns after download.",
      "Fix weak brand signals: sharp logo treatment and readable type so the attachment feels as serious as your service.",
      "Fix the reformatting loop: skip the extra design tool; export directly when the invoice is ready, then re-export anytime from history.",
    ],
    featuresSectionTitle: "PDF-focused strengths",
    features: [
      { icon: "Download", title: "One-tap export", desc: "Generate the file when the invoice is ready—no extra tools." },
      { icon: "FileText", title: "Readable structure", desc: "Tables and totals that stay aligned in the PDF." },
      { icon: "Palette", title: "Brand presence", desc: "Logo and colors carried through to the exported page." },
      { icon: "Clock", title: "History", desc: "Re-open past invoices and export again when needed." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Finalize the invoice", desc: "Check line items, taxes, discounts, and customer details in the editor." },
      { title: "Preview mentally", desc: "The on-screen structure maps to the PDF output." },
      { title: "Download PDF", desc: "Save locally and attach to email or upload to your records." },
    ],
    faqTitle: "Download invoice PDF FAQs",
    faqs: [
      {
        q: "What format is the download?",
        points: ["Standard PDF—email, WhatsApp, print all work.", "Clients don’t need special software to open it."],
      },
      {
        q: "Can I regenerate a PDF?",
        points: ["Yes—open from history and export again.", "Edit first if something changed; then download fresh."],
      },
      {
        q: "Does PDF include GST breakdown?",
        points: ["Whatever GST lines you set in the editor go to the file.", "Screen and PDF stay aligned—no manual merge."],
      },
    ],
    ctaTitle: "Download your first invoice PDF",
    ctaSubtitle: "Start free on easyBILL and export a print-ready file today.",
  },
}

export const seoBillingSoftwareSmallBusiness: SeoPageDefinition = {
  path: "/billing-software-for-small-business",
  meta: {
    title: "Billing Software for Small Business | Invoices & PDF | easyBILL",
    description:
      "easyBILL is billing software for small businesses: fast invoicing, customer and product catalog, GST-friendly lines, PDFs, and a simple dashboard.",
  },
  content: {
    heroEyebrow: "SMB-friendly",
    heroTitle: "Billing software for small business—with room to grow",
    heroSubtitle:
      "You don’t need enterprise complexity to look professional. easyBILL gives owners a focused invoicing workspace without burying you in modules you’ll never open.",
    problemTitle: "What small businesses lose to bloated billing systems",
    problems: [
      {
        title: "Invoicing takes too many clicks because the product does everything else first",
        text: "You only needed a bill today, but you’re clicking through CRM modules you’ll never use.",
      },
      {
        title: "Implementation time kills cash flow",
        text: "You can’t wait two weeks of setup to send this afternoon’s invoice.",
      },
      {
        title: "Surprise per-seat or add-on fees hit when money is already tight",
        text: "Unpredictable software bills make it harder to plan the week—let alone the quarter.",
      },
    ],
    solutionTitle: "How easyBILL fixes small-business billing overload",
    solutionLead:
      "easyBILL stays in the lane you repeat daily: create, send, track. You onboard in minutes with business profile, tax, and payment details—not a consultant. Subscription-style plans mean you’re not nickeled on every PDF; you scale when throughput—not menu depth—demands it.",
    solutionPoints: [
      "Fix menu bloat: one calm workspace focused on invoices, PDFs, and history—not twenty unused enterprise tabs.",
      "Fix slow time-to-first-bill: enter your details once, pick a template, and issue today’s document without a training project.",
      "Fix pricing anxiety: clear tiers tied to real usage; upgrade when you outgrow limits, not because a core step was an add-on.",
    ],
    featuresSectionTitle: "Small business essentials",
    features: [
      { icon: "Users", title: "Customer memory", desc: "Stop retyping the same buyer details." },
      { icon: "Package", title: "Product catalog", desc: "Standard SKUs and rates at your fingertips." },
      { icon: "BarChart3", title: "At-a-glance totals", desc: "Understand activity without exporting to Excel first." },
      { icon: "Shield", title: "Sensitive field care", desc: "Encryption for data that shouldn’t sit in plain text." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Onboard quickly", desc: "Add business profile, tax, and payment details once." },
      { title: "Bill daily work", desc: "Create invoices from catalog items in a calm editor." },
      { title: "Get paid faster", desc: "Clear PDFs and visible payment instructions reduce back-and-forth." },
    ],
    faqTitle: "Small business billing FAQs",
    faqs: [
      {
        q: "Is easyBILL only for product sellers?",
        points: ["No—services, rent, and mixed models fit fine.", "Line items + notes cover most real-world bills."],
      },
      {
        q: "Do I need an accountant to start?",
        points: ["You can send invoices from day one.", "Bring a pro when you need tax strategy—not to click “save.”"],
      },
      {
        q: "What if I outgrow the free tier?",
        points: ["Upgrade when limits match your pace.", "Same workspace—history doesn’t vanish."],
      },
    ],
    ctaTitle: "Run your small business billing on easyBILL",
    ctaSubtitle: "Start free and invite your real customers when you’re ready.",
  },
}

export const seoInvoiceCustomization: SeoPageDefinition = {
  path: "/invoice-customization",
  meta: {
    title: "Invoice Customization | Logo, Terms & Brand for PDFs | easyBILL",
    description:
      "Customize your invoices in easyBILL: add your logo, payment details, terms & notes, and branding—while keeping GST-ready formatting and clean A4 PDF export.",
  },
  content: {
    heroEyebrow: "Invoice customization",
    heroTitle: "Customize invoices without breaking the layout",
    heroSubtitle:
      "Update your logo, terms, and payment block in a guided editor—so your PDFs stay aligned, GST-ready, and client-ready.",
    problemTitle: "Customization usually creates new problems",
    problems: [
      {
        title: "You change branding… and spacing gets messy",
        text: "Logo size or color tweaks can ruin alignment when templates aren’t structured the way invoices are.",
      },
      {
        title: "Important details are hard to find and edit",
        text: "Terms, notes, and payment instructions end up hidden in the wrong place—or edited inconsistently each time.",
      },
      {
        title: "You fear exports won’t match your preview",
        text: "After editing, the PDF doesn’t look the same, so you hesitate before sending the document.",
      },
    ],
    solutionTitle: "Branding + details that stay consistent in every export",
    solutionLead:
      "easyBILL keeps invoice customization structured: update your branding, terms, and payment details inside the editor, and the PDF is generated from the same invoice layout. You get consistent A4 output, GST-ready formatting, and fewer “fix it again” moments.",
    solutionPoints: [
      "Keep totals and columns reliable: customization happens inside a structured editor, not by nudging text boxes.",
      "Edit once, reuse everywhere: business profile and saved settings carry your details across invoices.",
      "Export matches the preview: the file you download is generated from the same invoice structure you approved.",
    ],
    featuresSectionTitle: "What you can customize",
    features: [
      { icon: "Palette", title: "Logo & branding", desc: "Add your mark and business identity across invoices." },
      { icon: "FilePenLine", title: "Terms & notes", desc: "Payment terms, footnotes, and custom invoice copy." },
      { icon: "Banknote", title: "Bank & UPI block", desc: "Keep payment instructions clear on the document." },
      { icon: "Layers", title: "Template styles", desc: "Switch visual styles without rebuilding the invoice." },
      { icon: "Receipt", title: "GST-ready structure", desc: "Tax lines stay consistent with Indian invoice expectations." },
      { icon: "Cloud", title: "Sync across devices", desc: "Customize on phone or laptop—your account stays up to date." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Set your branding", desc: "Add your logo and business profile once so it follows every invoice." },
      { title: "Customize the invoice", desc: "Update terms, notes, and payment details inside the editor." },
      { title: "Export a clean PDF", desc: "Download and send with confidence—the PDF matches the layout you approved." },
    ],
    faqTitle: "Invoice customization FAQs",
    faqs: [
      {
        q: "Can I add my logo and payment details?",
        points: ["Yes—logo and payment block are part of your invoice customization.", "These details appear on the exported PDF too."],
      },
      {
        q: "Will customization affect GST formatting?",
        points: ["GST-ready structure stays consistent in the editor.", "Tax lines and totals remain tied to the invoice data."],
      },
      {
        q: "Do I need to reformat for the PDF?",
        points: ["No—export uses the same structured invoice layout.", "You avoid a second formatting step before sending clients."],
      },
    ],
    ctaTitle: "Start customizing your invoices",
    ctaSubtitle: "Create your account and make your next PDF look exactly like your business.",
  },
}

export const seoInvoiceTemplates: SeoPageDefinition = {
  path: "/invoice-templates",
  meta: {
    title: "Invoice Templates | Templates Variety for GST Invoices | easyBILL",
    description:
      "Explore easyBILL invoice templates: modern, minimal, and classic styles with GST-ready layout and clean A4 PDF export. Start free.",
  },
  content: {
    heroEyebrow: "Invoice templates",
    heroTitle: "Templates that look professional on every invoice",
    heroSubtitle:
      "Choose a template style that matches your brand—and keep GST formatting and PDF output consistent.",
    problemTitle: "Why most template options disappoint",
    problems: [
      {
        title: "Too few styles means you compromise your brand",
        text: "One “default” template rarely matches how you actually want to look.",
      },
      {
        title: "Templates ignore GST and tax layout",
        text: "When tax columns and GST splits aren’t designed for India, you end up explaining gaps to clients.",
      },
      {
        title: "Changing templates breaks what you already built",
        text: "Switching formats can force you to rework spacing, labels, and presentation.",
      },
    ],
    solutionTitle: "A template library built for Indian invoicing",
    solutionLead:
      "easyBILL gives you multiple invoice styles while keeping the invoice structure reliable. Pick a template, build with the same structured editor, and download a clean A4 PDF that stays aligned. Your invoice looks on-brand and reads correctly for Indian recipients.",
    solutionPoints: [
      "More variety that matches your brand: modern, minimal, and classic styles to fit different businesses.",
      "GST-ready layout: tax columns and splits are designed for Indian invoice expectations.",
      "Template switching doesn’t mean rebuilding: choose a style and keep your invoice data in one place.",
    ],
    featuresSectionTitle: "Template strengths you’ll notice",
    features: [
      { icon: "Layers", title: "Multiple template styles", desc: "Pick a look that matches your business identity." },
      { icon: "Sparkles", title: "Professional typography", desc: "Clean spacing and readable structure in every PDF." },
      { icon: "FileText", title: "A4 PDF output", desc: "Download files designed for screen viewing and print." },
      { icon: "Receipt", title: "GST-ready tax layout", desc: "CGST/SGST/IGST presentation that clients can read." },
      { icon: "Palette", title: "Brand-consistent documents", desc: "Logo and identity carry through to your exports." },
      { icon: "Cloud", title: "Works across devices", desc: "Template choices stay in your synced workspace." },
    ],
    howItWorksTitle: "How it works",
    steps: [
      { title: "Choose a template", desc: "Select a style and start with a clean, invoice-ready layout." },
      { title: "Fill invoice data", desc: "Add items, GST splits, customer and payment details in the editor." },
      { title: "Download the PDF", desc: "Export your A4 PDF with consistent spacing and tax columns." },
    ],
    faqTitle: "Invoice template FAQs",
    faqs: [
      {
        q: "How many template styles do you provide?",
        points: ["You can choose from multiple invoice styles in easyBILL.", "Switch templates while keeping your invoice data intact."],
      },
      {
        q: "Do templates support GST invoices?",
        points: ["Yes—GST-ready tax layout is part of the invoice structure.", "Your PDF keeps the GST split readable for recipients."],
      },
      {
        q: "Will changing templates change my GST totals?",
        points: ["Your totals follow the invoice data you entered.", "Templates change the look, not the underlying calculations."],
      },
    ],
    ctaTitle: "Start with an invoice template",
    ctaSubtitle: "Create your account and pick a template style that fits your brand.",
  },
}
