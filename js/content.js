/* All of Joel's profile data in one place. Edit this file to update the site's text. */
window.JM_CONTENT = {
  name: 'Moirangthem Joel Singh',
  short: 'Joel',
  email: 'joelofficialcoding@gmail.com',
  location: 'Lucknow, India',
  links: {
    github: 'https://github.com/JoelMoirangthem',
    linkedin: 'https://www.linkedin.com/in/joel-moirangthem-494119315/',
    leetcode: 'https://leetcode.com/u/JoelMoirangthem/',
    gfg: 'https://www.geeksforgeeks.org/profile/joelofficial123'
  },
  /* Swap for a tall, background-removed image and set cutout:true for the reference look. */
  portrait: { src: 'assets/portrait.webp', cutout: false, mono: false },

  skills: ['Full-Stack Developer', 'AI Agent Builder', 'Backend Engineer', 'Problem Solver', 'CS Engineer'],

  doors: [
    {
      slug: 'full-stack', plate: 'Full-Stack', title: 'Full-Stack Development',
      color: '#22304a', dark: '#1c2840', rgb: '92,132,202',
      tagline: 'From database to deployed UI',
      points: ['React & Next.js front ends', 'Node, Express & Flask back ends', 'MongoDB & MySQL data models', 'JWT auth & role-based access', 'Shipping and running real products'],
      intro: 'Products I have carried from the first schema to a live, working interface, including a store I built and run on my own.',
      projects: [
        { shot: 'healtine', meta: 'Healtine · Live', sub: 'Skincare e-commerce · healtine.com', name: 'Healtine.com', live: 'https://healtine.com', stack: ['E-commerce', 'Payments', 'AI assessment'],
          text: 'A science-backed skincare store that I designed, developed and run as its only engineer: shop, kits, cart and checkout, offers, a skin-assessment quiz and a partner programme.' },
        { shot: 'library-management', meta: 'NearMe Library · Live', sub: 'Library & seat management · nearmelib.in', name: 'StudySeat', live: 'https://nearmelib.in/', repo: 'Library-Management', stack: ['TypeScript', 'Supabase'],
          text: 'Study-library and seat management: members, seat allocation and day-to-day library operations.' },
        { shot: 'manipurtourism', meta: 'Website build', sub: 'Tourism showcase', name: 'ManipurTourism', repo: 'ManipurTourism', stack: ['TypeScript'],
          text: 'A tourism showcase for Manipur, presenting places, culture and travel information.' },
        { shot: 'weather-analysing', meta: 'Web app', sub: 'Live weather dashboard', name: 'Weather dashboard', repo: 'Weather-analysing', stack: ['HTML', 'JavaScript', 'API'],
          text: 'A real-time weather dashboard that fetches and visualises live conditions.' },
        { shot: 'to-do-list', meta: 'Web app', sub: 'Task manager', name: 'To-Do List', repo: 'To-Do-List', stack: ['JavaScript'],
          text: 'A lightweight task manager for adding, completing and clearing tasks.' }
      ]
    },
    {
      slug: 'ai-agents', plate: 'AI Agents', title: 'AI Agents',
      color: '#4a3540', dark: '#3f2d37', rgb: '178,106,148',
      tagline: 'Agents that ask before they act',
      points: ['LangGraph & tool-calling agents', 'Human-in-the-loop approval gates', 'Multi-provider LLM failover', 'Voice & resume-aware interviews', 'MCP integrations'],
      intro: 'AI systems that are safe by design: the model can read and plan, but destructive actions wait for a human to approve them.',
      projects: [
        { shot: 'smarteducation', meta: 'AI platform', sub: 'School management · agentic assistant', name: 'SmartEducation', repo: 'smartEducation', stack: ['React', 'Node.js', 'FastAPI', 'LangGraph', 'DeepFace', 'Socket.io'],
          text: 'AI-powered school management platform with face-recognition attendance and an agentic assistant using 77 native tools for natural-language database operations, with human approval for every modification.' },
        { shot: 'ai-interview', meta: 'PrepAI · Live', sub: 'Voice-first mock interviews', name: 'PrepAI, AI Interview Coach', live: 'https://freeaiinterview.onrender.com/', repo: 'ai-interview', stack: ['React', 'Express', 'MongoDB', 'Groq', 'Monaco'],
          text: 'Voice-first mock interviews with resume-based questions, a live coding editor for 7 languages, 10 interview modes, adaptive difficulty and AI answer evaluation.' },
        { shot: 'whatsapp-agent', meta: 'AI agent', sub: 'Approval-gated messaging agent', name: 'WhatsApp Agent', repo: '-whatsapp-agent', stack: ['Python', 'Go', 'MCP', 'SQLite'],
          text: 'An approval-gated AI agent for WhatsApp. It can read history, but every send or delete needs explicit human approval.' },
        { shot: 'ai_account', meta: 'AI agent', sub: 'Company research assistant', name: 'Account Plan Agent', repo: 'ai_account', stack: ['React', 'TypeScript', 'Express', 'OpenRouter'],
          text: 'Chat-first research agent that builds structured company account plans from live web and news data and revises single sections on request.' }
      ]
    },
    {
      slug: 'backend', plate: 'Backend', title: 'Backend & APIs',
      color: '#7a8670', dark: '#66705d', rgb: '132,174,104',
      tagline: 'The parts users never see',
      points: ['REST API design', 'Auth, RBAC & audit logging', 'Realtime with Socket.io', 'Relational & document databases', 'Language tooling in Java'],
      intro: 'Services, data models and the plumbing that keeps products fast, secure and correct.',
      projects: [
        { shot: 'spotify-backend', meta: 'Backend', sub: 'Music streaming API', name: 'Spotify Backend', repo: 'SPOTIFY-BACKEND', stack: ['JavaScript', 'Node.js'],
          text: 'A music-streaming backend: the API layer for users, tracks and playlists.' },
        { shot: 'guesthouse', meta: 'Full-stack', sub: 'Room booking & approvals', name: 'GuestHouse', repo: 'GuestHouse', stack: ['Laravel', 'PHP', 'MySQL'],
          text: 'A room booking and approval system with request workflows for guests and administrators.' },
        { shot: 'razorpay', meta: 'Payments', sub: 'Finance controller', name: 'Razorpay Finance Controller', repo: 'razorpay-finance-controller', stack: ['Razorpay', 'HTML'],
          text: 'A finance controller built around Razorpay payments.' },
        { shot: 'mini-interpreter', meta: 'Language tooling', sub: 'Interpreter in Java', name: 'mini-Interpreter', repo: 'mini-Enterpreter', stack: ['Java'],
          text: 'A small interpreter written from scratch in Java: tokenising, parsing and evaluating a toy language.' }
      ]
    },
    {
      slug: 'problem-solving', plate: 'DSA', title: 'Problem Solving',
      color: '#a4552c', dark: '#8c4826', rgb: '226,122,58',
      tagline: '219 problems and counting',
      points: ['219 LeetCode problems solved', '29th institute rank on GeeksforGeeks', 'Advanced DSA coursework', 'Myers diff in Python', 'Daily Java DSA practice'],
      intro: 'Algorithms practice that keeps the fundamentals sharp.',
      stats: { solved: 219, easy: 94, medium: 107, hard: 18 },
      projects: [
        { shot: 'leetcode', device: 'phone', meta: 'LeetCode · Live', sub: '219 solved · top 81.5%', name: 'LeetCode', live: 'https://leetcode.com/u/JoelMoirangthem/', stack: ['94 easy', '107 medium', '18 hard'],
          text: '219 problems solved across arrays, graphs, dynamic programming and more.' },
        { shot: 'gfg', device: 'phone', meta: 'GeeksforGeeks · Live', sub: 'Institute rank 29 · SRMU', name: 'GeeksforGeeks', live: 'https://www.geeksforgeeks.org/profile/joelofficial123', stack: ['Institute rank 29'],
          text: 'Ranked 29th at Shri Ramswaroop Memorial University on GeeksforGeeks.' },
        { shot: 'myers-diff', meta: 'Algorithm', sub: 'Shortest edit script', name: 'myers-diff-algorithm', repo: 'myers-diff-algorithm', stack: ['Python'],
          text: 'An implementation of the Myers diff algorithm, the shortest-edit-script approach used by git diff.' },
        { shot: 'java-dsa', meta: 'Practice', sub: 'DSA in Java', name: 'Java-DSA', repo: 'Java-DSA', stack: ['Java'],
          text: 'Data structures and algorithms practice, worked through in Java.' }
      ]
    },
    {
      slug: 'achievements', plate: 'Wins', title: 'Achievements',
      color: '#262523', dark: '#201f1d', rgb: '226,178,70',
      tagline: 'The hidden door, for the patient',
      points: ['Google Cloud Arcade Champion tier', 'HackJNU 4.0 finalist', 'GeeksforGeeks institute rank 29'],
      intro: 'Things I am proud of along the way.',
      projects: [
        { badge: 'GCP', meta: 'Achievement', sub: 'Champion tier', name: 'Google Cloud Arcade', stack: ['Champion tier'], text: 'Reached the Champion tier of the Google Cloud Arcade programme.' },
        { badge: '4.0', meta: 'Hackathon', sub: 'Finalist', name: 'HackJNU 4.0', stack: ['Finalist'], text: 'Finalist at HackJNU 4.0, the hackathon at Jawaharlal Nehru University.' },
        { badge: '#29', meta: 'Ranking', sub: 'Institute rank', name: 'GeeksforGeeks', stack: ['Rank 29'], text: '29th institute rank at SRMU, Lucknow.' }
      ]
    }
  ],

  story: [
    { year: 2026, when: '2026 — Now', title: 'Software Development Engineer', org: 'Healtine.com · Sole developer', now: true,
      points: ['Built and run Healtine’s skincare store end to end on my own, from catalogue and kits to cart and checkout.',
               'Shipped the AI-assisted skin assessment, live offer countdowns and the partner programme.'] },
    { year: 2026, when: 'Jun 2026 — Aug 2026', title: 'SDE Intern', org: 'DevOpsGenie AI',
      points: ['Worked hands-on with agentic AI, deep agents and AI-powered application development.',
               'Built agent-based workflows that solve real-world problems with modern engineering practice.'] },
    { year: 2024, when: 'Sep 2024 — Now', title: 'Building in public', org: 'GitHub · 34 public repositories',
      points: ['Shipped full-stack apps and approval-gated AI agents: SmartEducation, PrepAI and the WhatsApp Agent.',
               'Champion tier in Google Cloud Arcade and a finalist at HackJNU 4.0.'] },
    { year: 2024, when: 'Until May 2027', title: 'B.Tech, Computer Science', org: 'Sitare University with SRMU, Lucknow',
      points: ['Advanced DSA, OOP, DBMS, web application development and artificial intelligence.',
               '219 LeetCode problems solved and 29th institute rank on GeeksforGeeks.'] }
  ]
};
