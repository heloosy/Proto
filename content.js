class IncidentAnalyzer {
  constructor() {
    this.isAnalyzing = false
    this.reportedIncidents = new Set()
    this.incidentKeywords = {
      accident: [
        "accident",
        "crash",
        "collision",
        "hit",
        "injured",
        "ambulance",
        "emergency",
        "wreck",
        "smash",
        "impact",
      ],
      fire: ["fire", "burning", "smoke", "flames", "firefighters", "blaze", "burn", "ignite", "combustion"],
      pothole: ["pothole", "road damage", "broken road", "road repair", "bad road", "street damage", "pavement"],
      garbage: ["garbage", "trash", "waste", "dirty", "cleanup", "litter", "rubbish", "debris"],
      pollution: ["pollution", "smog", "air quality", "toxic", "contamination", "polluted", "hazardous"],
      traffic: ["traffic jam", "congestion", "blocked road", "traffic", "stuck", "gridlock", "backup"],
    }

    this.severityIndicators = {
      critical: [
        "multiple casualties",
        "mass casualty",
        "many injured",
        "several dead",
        "fatalities",
        "major accident",
        "pile up",
        "multi-car",
        "building collapse",
        "explosion",
        "dozens injured",
        "hundreds affected",
        "emergency declared",
        "disaster",
        "multiple ambulances",
        "helicopter rescue",
        "road closed",
        "highway shutdown",
        "evacuation",
        "catastrophic",
        "devastating",
      ],
      high: [
        "serious injury",
        "hospitalized",
        "critical condition",
        "life threatening",
        "major damage",
        "significant",
        "severe",
        "emergency services",
        "fire department",
        "police cordoned",
        "evacuation",
        "multiple vehicles",
        "trapped",
        "rescue operation",
        "intensive care",
        "surgery required",
      ],
      medium: [
        "injured",
        "hurt",
        "damage",
        "emergency",
        "ambulance",
        "police",
        "firefighters",
        "blocked",
        "closed",
        "accident",
        "crash",
        "collision",
        "minor injury",
        "property damage",
        "disruption",
      ],
      low: ["minor", "small", "little", "slight", "fender bender", "scratch", "dent", "no injuries"],
    }

    this.scaleIndicators = [
      "multiple",
      "several",
      "many",
      "dozens",
      "hundreds",
      "mass",
      "major",
      "large scale",
      "widespread",
      "entire",
      "whole",
      "all",
      "numerous",
      "massive",
      "huge",
    ]

    this.locationKeywords = [
      "at",
      "near",
      "on",
      "in",
      "street",
      "road",
      "avenue",
      "highway",
      "junction",
      "intersection",
    ]
    this.timeKeywords = ["now", "today", "yesterday", "morning", "evening", "night", "ago", "minutes", "hours"]

    this.indiaKeywords = [
      "india",
      "indian",
      "delhi",
      "mumbai",
      "bangalore",
      "chennai",
      "kolkata",
      "hyderabad",
      "pune",
      "ahmedabad",
      "surat",
      "jaipur",
      "lucknow",
      "kanpur",
      "nagpur",
      "indore",
      "thane",
      "bhopal",
      "visakhapatnam",
      "pimpri",
      "patna",
      "vadodara",
      "ghaziabad",
      "ludhiana",
      "agra",
      "nashik",
      "faridabad",
      "meerut",
      "rajkot",
      "kalyan",
      "vasai",
      "varanasi",
      "srinagar",
      "aurangabad",
      "dhanbad",
      "amritsar",
      "navi mumbai",
      "allahabad",
      "ranchi",
      "howrah",
      "coimbatore",
      "jabalpur",
      "gwalior",
      "vijayawada",
      "jodhpur",
      "madurai",
      "raipur",
      "kota",
      "guwahati",
      "chandigarh",
      "solapur",
      "hubli",
      "tiruchirappalli",
      "bareilly",
      "mysore",
      "tiruppur",
      "gurgaon",
      "aligarh",
      "jalandhar",
      "bhubaneswar",
      "salem",
      "warangal",
      "guntur",
      "bhiwandi",
      "saharanpur",
      "durgapur",
      "asansol",
      "rourkela",
      "nanded",
      "kolhapur",
      "ajmer",
      "akola",
      "gulbarga",
      "jamnagar",
      "ujjain",
      "loni",
      "siliguri",
      "jhansi",
      "ulhasnagar",
      "jammu",
      "sangli",
      "mangalore",
      "erode",
      "belgaum",
      "ambattur",
      "tirunelveli",
      "malegaon",
      "gaya",
      "jalgaon",
      "udaipur",
      "maheshtala",
      "davanagere",
      "kozhikode",
      "kurnool",
      "rajpur sonarpur",
      "rajahmundry",
      "bokaro",
      "south dumdum",
      "bellary",
      "patiala",
      "gopalpur",
      "agartala",
      "bhagalpur",
      "muzaffarnagar",
      "bhatpara",
      "panihati",
      "latur",
      "dhule",
      "rohtak",
      "korba",
      "bhilwara",
      "berhampur",
      "muzaffarpur",
      "ahmednagar",
      "mathura",
      "kollam",
      "avadi",
      "kadapa",
      "kamarhati",
      "sambalpur",
      "bilaspur",
      "shahjahanpur",
      "satara",
      "bijapur",
      "rampur",
      "shivamogga",
      "chandrapur",
      "junagadh",
      "thrissur",
      "alwar",
      "bardhaman",
      "kulti",
      "kakinada",
      "nizamabad",
      "parbhani",
      "tumkur",
      "khammam",
      "ozhukarai",
      "bihar sharif",
      "panipat",
      "darbhanga",
      "bally",
      "aizawl",
      "dewas",
      "ichalkaranji",
      "karnal",
      "bathinda",
      "jalna",
      "eluru",
      "kirari suleman nagar",
      "baranagar",
      "purnia",
      "satna",
      "mau",
      "sonipat",
      "farrukhabad",
      "sagar",
      "rourkela",
      "durg",
      "imphal",
      "ratlam",
      "hapur",
      "arrah",
      "anantapur",
      "karimnagar",
      "etawah",
      "ambernath",
      "north dumdum",
      "bharatpur",
      "begusarai",
      "new delhi",
      "gandhinagar",
      "baranagar",
      "tiruvottiyur",
      "puducherry",
      "sikar",
      "thoothukudi",
      "rewa",
      "mirzapur",
      "raichur",
      "pali",
      "ramagundam",
      "silchar",
      "orai",
      "nandyal",
      "morena",
      "bhiwani",
      "porbandar",
      "palakkad",
      "anand",
      "purnia",
      "baharampur",
      "barmer",
      "morvi",
      "orai",
      "bahraich",
      "vellore",
      "mahesana",
      "sambalpur",
      "raiganj",
      "sirsa",
      "danapur",
      "serampore",
      "sultan pur majra",
      "guna",
      "jaunpur",
      "panvel",
      "shivpuri",
      "surendranagar dudhrej",
      "unnao",
      "hugli",
      "alappuzha",
      "kottayam",
      "machilipatnam",
      "shimla",
      "adoni",
      "tenali",
      "proddatur",
      "saharsa",
      "hindupur",
      "sasaram",
      "hajipur",
      "bhimavaram",
      "dehri",
      "madanapalle",
      "siwan",
      "bettiah",
      "guntakal",
      "srikakulam",
      "motihari",
      "dharmavaram",
      "gudivada",
      "narasaraopet",
      "bagaha",
      "miryalaguda",
      "tadipatri",
      "kishanganj",
      "karaikudi",
      "suryapet",
      "jamalpur",
      "kavali",
      "tadepalligudem",
      "amaravati",
      "buxar",
      "jehanabad",
      "aurangabad",
      "up",
      "mp",
      "maharashtra",
      "karnataka",
      "tamil nadu",
      "west bengal",
      "gujarat",
      "rajasthan",
      "punjab",
      "haryana",
      "kerala",
      "odisha",
      "telangana",
      "andhra pradesh",
      "assam",
      "bihar",
      "jharkhand",
      "uttarakhand",
      "himachal pradesh",
      "tripura",
      "meghalaya",
      "manipur",
      "nagaland",
      "goa",
      "arunachal pradesh",
      "mizoram",
      "sikkim",
      "jammu and kashmir",
      "ladakh",
      "chandigarh",
      "delhi",
      "puducherry",
      "andaman and nicobar",
      "lakshadweep",
      "dadra and nagar haveli",
      "daman and diu",
    ]

    this.minSeverity = "low"
    this.chrome = window.chrome
    this.websiteUrl = "http://localhost:3000"
    this.lastAnalysisTime = 0
    this.analysisCount = 0
    this.reportedIncidentsWithTime = new Map()

    this.init()
  }

  init() {
    this.createOverlay()
    this.checkAnalysisStatus()
    this.observeNewPosts()
    setTimeout(() => this.performInitialAnalysis(), 2000)
  }

  performInitialAnalysis() {
    console.log("[v0] Performing initial analysis...")
    this.analyzePosts()
  }

  checkAnalysisStatus() {
    this.safeChromeCall(
      () => {
        this.chrome.storage.local.get(["analysisEnabled"], (result) => {
          if (this.chrome.runtime.lastError) {
            console.log("[v0] Chrome runtime error:", this.chrome.runtime.lastError)
            return
          }
          if (result.analysisEnabled !== false) {
            this.startAnalyzing()
          }
        })
      },
      () => {
        // Fallback: start analyzing if Chrome APIs unavailable
        this.startAnalyzing()
      },
    )
  }

  createOverlay() {
    this.overlay = document.createElement("div")
    this.overlay.className = "incident-analyzer-overlay"
    this.overlay.style.display = "none"
    document.body.appendChild(this.overlay)
  }

  showAnalyzing() {
    this.overlay.innerHTML = `
      <div class="analyzing-indicator">
        <div class="spinner"></div>
        <span>Analyzing posts for incidents... (Analysis #${++this.analysisCount})</span>
      </div>
    `
    this.overlay.style.display = "block"

    setTimeout(() => {
      this.overlay.style.display = "none"
    }, 3000)
  }

  showResult(incident) {
    if (!this.meetsSeverityThreshold(incident.severity)) {
      return
    }

    const severityColors = {
      critical: "#ff0000",
      high: "#ff6600",
      medium: "#ffaa00",
      low: "#cccccc",
    }

    this.overlay.className = "incident-analyzer-overlay analysis-complete"
    this.overlay.innerHTML = `
      <div>
        <strong>🚨 ${incident.severity.toUpperCase()} Incident Detected!</strong><br>
        <strong>Type:</strong> ${incident.type}<br>
        <strong>Severity:</strong> <span style="color: ${severityColors[incident.severity]}">${incident.severity}</span><br>
        <strong>Location:</strong> ${incident.location || "Not specified"}<br>
        <strong>Time:</strong> ${incident.time || "Not specified"}<br>
        <strong>Impact Score:</strong> ${incident.impactScore}/10<br>
        ${incident.postUrl !== window.location.href ? `<strong>Post Link:</strong> <a href="${incident.postUrl}" target="_blank" style="color: #0066cc;">View Post</a><br>` : ""}
        <small>Analysis #${this.analysisCount}</small>
      </div>
    `
    this.overlay.style.display = "block"

    setTimeout(() => {
      this.overlay.style.display = "none"
      this.overlay.className = "incident-analyzer-overlay"
    }, 5000)
  }

  startAnalyzing() {
    setInterval(() => {
      this.analyzePosts()
    }, 5000) // Analyze every 5 seconds
  }

  observeNewPosts() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          setTimeout(() => this.analyzePosts(), 1000)
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  analyzePosts() {
    if (this.isAnalyzing) return

    const now = Date.now()
    if (now - this.lastAnalysisTime < 3000) {
      console.log("[v0] Analysis rate limited, skipping")
      return
    }
    this.lastAnalysisTime = now

    try {
      if (!window.chrome || !window.chrome.runtime || !window.chrome.runtime.id) {
        console.warn("[v0] Extension context invalidated, stopping analysis")
        return
      }

      if (window.chrome?.storage?.local) {
        window.chrome.storage.local.get(["analysisEnabled"], (result) => {
          if (window.chrome.runtime.lastError || !window.chrome.runtime.id) {
            console.warn("[v0] Chrome runtime error or context invalidated:", window.chrome.runtime.lastError)
            return // Don't run fallback if extension context is invalid
          }
          if (result.analysisEnabled === false) {
            console.log("[v0] Analysis disabled, skipping post analysis")
            return
          }
          this.performAnalysis()
        })
      } else {
        console.log("[v0] Chrome API not available, running fallback analysis")
        this.performAnalysis()
      }
    } catch (err) {
      console.error("[v0] analyzePosts crashed:", err)
      if (!err.message.includes("Extension context invalidated")) {
        this.performAnalysis()
      }
    }
  }

  performAnalysis() {
    this.isAnalyzing = true
    this.showAnalyzing()

    const posts = this.getPosts()
    let significantIncidents = 0

    console.log("[v0] Analyzing", posts.length, "posts")
    console.log("[v0] Current URL:", window.location.href)
    console.log("[v0] Current hostname:", window.location.hostname)

    posts.forEach((post, index) => {
      const text = this.extractText(post)
      console.log(`[v0] Post ${index + 1} text (first 100 chars):`, text.substring(0, 100))

      if (!this.isFromIndia(text)) {
        console.log(`[v0] Post ${index + 1} filtered out - not from India`)
        return
      }

      const incident = this.analyzeText(text, post)

      if (incident) {
        console.log(
          "[v0] Found incident:",
          incident.type,
          "severity:",
          incident.severity,
          "confidence:",
          incident.confidence,
        )

        if (this.isDuplicateIncident(incident)) {
          console.log("[v0] Duplicate incident detected, skipping")
          return
        }

        if (this.meetsSeverityThreshold(incident.severity)) {
          this.highlightPost(post, incident)
          this.saveIncident(incident)
          this.markIncidentAsReported(incident)
          significantIncidents++

          if (significantIncidents === 1) {
            this.showResult(incident)
          }
        } else {
          console.log("[v0] Incident filtered out due to low severity")
        }
      }
    })

    console.log("[v0] Found", significantIncidents, "significant incidents")

    if (significantIncidents === 0 && posts.length > 0) {
      console.log("[v0] No incidents detected in", posts.length, "posts")
      this.showNoIncidentsFound(posts.length)
    }

    this.isAnalyzing = false
  }

  showNoIncidentsFound(postCount) {
    this.overlay.innerHTML = `
      <div class="analyzing-indicator">
        <span>✅ Analyzed ${postCount} posts - No incidents detected</span>
      </div>
    `
    this.overlay.style.display = "block"

    setTimeout(() => {
      this.overlay.style.display = "none"
    }, 2000)
  }

  getPosts() {
    console.log("[v0] Looking for posts on:", window.location.hostname)

    let posts = []

    // Twitter/X selectors (updated for current version)
    if (window.location.hostname.includes("twitter.com") || window.location.hostname.includes("x.com")) {
      posts = Array.from(document.querySelectorAll('[data-testid="tweet"]'))
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
      }
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll('div[data-testid="tweetText"]'))
          .map((el) => el.closest("article"))
          .filter(Boolean)
      }
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll("article"))
      }
    }

    // Facebook selectors
    if (window.location.hostname.includes("facebook.com")) {
      posts = Array.from(document.querySelectorAll('[data-pagelet="FeedUnit"]'))
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll('div[role="article"]'))
      }
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll('[data-testid="story-subtitle"]'))
          .map((el) => el.closest('div[role="article"]'))
          .filter(Boolean)
      }
    }

    // Instagram selectors
    if (window.location.hostname.includes("instagram.com")) {
      posts = Array.from(document.querySelectorAll("article"))
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll('div[role="button"] article'))
      }
    }

    // LinkedIn selectors
    if (window.location.hostname.includes("linkedin.com")) {
      posts = Array.from(document.querySelectorAll(".feed-shared-update-v2"))
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll("div[data-urn]"))
      }
      if (posts.length === 0) {
        posts = Array.from(document.querySelectorAll(".update-components-text"))
          .map((el) => el.closest(".feed-shared-update-v2"))
          .filter(Boolean)
      }
    }

    if (posts.length === 0) {
      console.log("[v0] Using generic fallback selectors")
      posts = Array.from(document.querySelectorAll("div, article, section, p"))
        .filter((el) => {
          const text = el.innerText || el.textContent || ""
          const hasRelevantText = text.length > 30 && text.length < 2000
          const hasIncidentKeywords = this.hasAnyIncidentKeywords(text)
          return hasRelevantText && (hasIncidentKeywords || text.length > 100)
        })
        .slice(0, 20)
    }

    console.log("[v0] Found", posts.length, "posts using selectors")

    if (posts.length > 0) {
      console.log("[v0] Sample post text:", this.extractText(posts[0]).substring(0, 200))
    }

    return posts.slice(0, 10) // Analyze only first 10 posts
  }

  hasAnyIncidentKeywords(text) {
    const lowerText = text.toLowerCase()
    for (const [type, keywords] of Object.entries(this.incidentKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return true
        }
      }
    }
    return false
  }

  extractText(post) {
    return post.innerText || post.textContent || ""
  }

  analyzeText(text, postElement = null) {
    const lowerText = text.toLowerCase()

    // Check for incident keywords
    let incidentType = null
    let confidence = 0

    for (const [type, keywords] of Object.entries(this.incidentKeywords)) {
      const matches = keywords.filter((keyword) => lowerText.includes(keyword)).length
      if (matches > confidence) {
        confidence = matches
        incidentType = type
      }
    }

    if (!incidentType || confidence === 0) return null

    const severity = this.calculateSeverity(text)
    const impactScore = this.calculateImpactScore(text)

    // Extract location
    const location = this.extractLocation(text)

    // Extract time
    const time = this.extractTime(text)

    const postUrl = this.extractPostUrl(postElement)

    return {
      type: incidentType,
      severity: severity,
      impactScore: impactScore,
      location: location,
      time: time,
      text: text.substring(0, 300),
      confidence: confidence,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      postUrl: postUrl,
      analysisId: this.analysisCount,
      keywords: this.incidentKeywords[incidentType].filter((keyword) => lowerText.includes(keyword)),
    }
  }

  calculateSeverity(text) {
    const lowerText = text.toLowerCase()

    // Check for critical indicators first
    for (const indicator of this.severityIndicators.critical) {
      if (lowerText.includes(indicator)) {
        return "critical"
      }
    }

    // Check for high severity
    for (const indicator of this.severityIndicators.high) {
      if (lowerText.includes(indicator)) {
        return "high"
      }
    }

    // Check for medium severity
    for (const indicator of this.severityIndicators.medium) {
      if (lowerText.includes(indicator)) {
        return "medium"
      }
    }

    // Check for low severity indicators (to explicitly mark as low)
    for (const indicator of this.severityIndicators.low) {
      if (lowerText.includes(indicator)) {
        return "low"
      }
    }

    return "medium"
  }

  calculateImpactScore(text) {
    const lowerText = text.toLowerCase()
    let score = 1

    // Scale indicators add points
    for (const indicator of this.scaleIndicators) {
      if (lowerText.includes(indicator)) {
        score += 2
      }
    }

    // Numbers indicating scale
    const numberMatches = text.match(/\d+/g)
    if (numberMatches) {
      for (const num of numberMatches) {
        const value = Number.parseInt(num)
        if (value > 10) score += 2
        if (value > 50) score += 3
        if (value > 100) score += 4
      }
    }

    // Emergency response indicators
    const emergencyWords = ["ambulance", "fire truck", "police", "helicopter", "rescue"]
    for (const word of emergencyWords) {
      if (lowerText.includes(word)) {
        score += 1
      }
    }

    return Math.min(score, 10) // Cap at 10
  }

  meetsSeverityThreshold(severity) {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
    const minLevel = severityLevels[this.minSeverity] || 1 // Changed default to 1 for low threshold
    const currentLevel = severityLevels[severity] || 1

    return currentLevel >= minLevel
  }

  highlightPost(post, incident) {
    if (!post.classList.contains("incident-highlight")) {
      post.classList.add("incident-highlight")

      const badge = document.createElement("span")
      badge.className = `incident-badge severity-${incident.severity}`
      badge.textContent = `${incident.type} (${incident.severity})`

      const firstChild = post.firstElementChild
      if (firstChild) {
        firstChild.appendChild(badge)
      }
    }
  }

  saveIncident(incident) {
    try {
      this.safeChromeCall(
        () => {
          window.chrome.storage.local.get(["incidents"], (result) => {
            if (window.chrome.runtime.lastError) {
              console.log("[v0] Error getting incidents:", window.chrome.runtime.lastError)
              return
            }

            const incidents = result.incidents || []
            incidents.unshift(incident)

            // Keep only last 100 incidents
            if (incidents.length > 100) {
              incidents.splice(100)
            }

            window.chrome.storage.local.set({ incidents: incidents }, () => {
              if (window.chrome.runtime.lastError) {
                console.log("[v0] Error saving incidents:", window.chrome.runtime.lastError)
                return
              }

              if (this.isExtensionContextValid()) {
                window.chrome.runtime.sendMessage(
                  {
                    action: "updateBadge",
                    count: incidents.length,
                  },
                  () => {
                    if (window.chrome.runtime.lastError) {
                      console.log("[v0] Error updating badge:", window.chrome.runtime.lastError)
                    }
                  },
                )
              }
            })
          })
        },
        () => {
          console.log("[v0] Chrome storage not available, incident:", incident)
        },
      )

      if (this.shouldCreateAutoComplaint(incident)) {
        this.createAutoComplaint(incident)
      }
    } catch (error) {
      console.log("[v0] Error saving incident:", error)
    }
  }

  shouldCreateAutoComplaint(incident) {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
    const incidentLevel = severityLevels[incident.severity] || 1
    const minLevel = severityLevels["medium"] || 2

    return incidentLevel >= minLevel && incident.impactScore >= 2
  }

  async createAutoComplaint(incident) {
    try {
      console.log("[v0] Creating auto-complaint for incident:", incident.type)

      const complaintData = {
        id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Auto-detected ${incident.type}: ${incident.severity} severity`,
        description: `Automatically detected incident from social media analysis:\n\n${incident.text}\n\nSeverity: ${incident.severity}\nImpact Score: ${incident.impactScore}/10\nSource: ${incident.url}\nPost Link: ${incident.postUrl || "N/A"}`,
        type: incident.type,
        location: incident.location || "Location extracted from social media",
        severity: incident.severity,
        source: "extension",
        timestamp: incident.timestamp,
        postUrl: incident.postUrl,
        department: this.mapIncidentToDepartment(incident.type),
        status: "pending",
        impactScore: incident.impactScore,
        keywords: incident.keywords,
        socialMediaPlatform: this.detectPlatform(),
        autoGenerated: true,
      }

      await this.storeComplaintForAdmin(complaintData)

      this.sendToBridge(complaintData)

      this.showAutoComplaintNotification(incident)

      console.log("[v0] Report has been sent to admin dashboard:", complaintData.title)
    } catch (error) {
      console.error("[v0] Error creating auto-complaint:", error)
    }
  }

  sendToBridge(complaintData) {
    try {
      console.log("[v0] Sending complaint to bridge page:", complaintData.title)

      // Send message to background script which will forward to bridge
      const chrome = window.chrome
      chrome.runtime.sendMessage(
        {
          action: "NEW_COMPLAINT",
          complaint: complaintData,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("[v0] Error sending to bridge:", chrome.runtime.lastError.message)
          } else {
            console.log("[v0] Successfully sent complaint to bridge")
          }
        },
      )
    } catch (error) {
      console.error("[v0] Error in sendToBridge:", error)
    }
  }

  showAutoComplaintNotification(incident) {
    const notification = document.createElement("div")
    notification.className = "auto-complaint-notification"
    notification.innerHTML = `
      <div class="notification-content">
        <strong>🚨 Auto-Complaint Created!</strong><br>
        <span>High-severity ${incident.type} detected and reported</span><br>
        <small>Severity: ${incident.severity} | Impact: ${incident.impactScore}/10</small>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 5000)
  }

  extractLocation(text) {
    const locationPatterns = [
      /(?:at|near|on|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Road|Rd|Avenue|Ave|Highway|Hwy|Boulevard|Blvd))?)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Street|St|Road|Rd|Avenue|Ave|Highway|Hwy|Boulevard|Blvd)/gi,
      /(?:intersection|junction)\s+(?:of\s+)?([^.!?]+)/gi,
    ]

    for (const pattern of locationPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return matches[0].trim()
      }
    }

    return null
  }

  extractTime(text) {
    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/gi,
      /(?:at|around)\s+(\d{1,2}:\d{2})/gi,
      /(this\s+morning|this\s+afternoon|this\s+evening|tonight|yesterday|today)/gi,
      /(\d+)\s+(?:minutes?|hours?)\s+ago/gi,
      /(now|just\s+now|moments?\s+ago)/gi,
    ]

    for (const pattern of timePatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return matches[0].trim()
      }
    }

    return null
  }

  isFromIndia(text) {
    const lowerText = text.toLowerCase()
    return this.indiaKeywords.some((keyword) => lowerText.includes(keyword))
  }

  isDuplicateIncident(incident) {
    const incidentHash = this.generateIncidentHash(incident)
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    // Check if we have this incident hash with timestamp
    const existingIncident = this.reportedIncidentsWithTime.get(incidentHash)
    if (existingIncident && now - existingIncident.timestamp < oneHour) {
      return true // Still within duplicate window
    }

    // Clean old entries and add new one
    this.reportedIncidentsWithTime.set(incidentHash, { timestamp: now })
    return false
  }

  generateIncidentHash(incident) {
    const hashString = `${incident.type}-${incident.location || "unknown"}-${incident.text.substring(0, 100)}`
    return hashString.toLowerCase().replace(/\s+/g, "")
  }

  markIncidentAsReported(incident) {
    const incidentHash = this.generateIncidentHash(incident)
    this.reportedIncidents.add(incidentHash)

    if (this.reportedIncidents.size > 1000) {
      const firstItem = this.reportedIncidents.values().next().value
      this.reportedIncidents.delete(firstItem)
    }
  }

  extractPostUrl(postElement) {
    if (!postElement) return window.location.href

    let postUrl = window.location.href

    if (window.location.hostname.includes("twitter.com") || window.location.hostname.includes("x.com")) {
      const timeElement = postElement.querySelector("time")
      if (timeElement && timeElement.parentElement && timeElement.parentElement.href) {
        postUrl = timeElement.parentElement.href
      }
    }

    if (window.location.hostname.includes("facebook.com")) {
      const permalinkElement = postElement.querySelector('a[href*="/posts/"], a[href*="/permalink/"]')
      if (permalinkElement) {
        postUrl = permalinkElement.href
      }
    }

    if (window.location.hostname.includes("instagram.com")) {
      const timeElement = postElement.querySelector("time")
      if (timeElement && timeElement.parentElement && timeElement.parentElement.href) {
        postUrl = timeElement.parentElement.href
      }
    }

    if (window.location.hostname.includes("linkedin.com")) {
      const permalinkElement = postElement.querySelector('a[href*="/feed/update/"]')
      if (permalinkElement) {
        postUrl = permalinkElement.href
      }
    }

    return postUrl
  }

  isExtensionContextValid() {
    try {
      return !!(window.chrome && window.chrome.runtime && window.chrome.runtime.id)
    } catch (error) {
      return false
    }
  }

  safeChromeCall(callback, fallback = () => {}) {
    if (!this.isExtensionContextValid()) {
      console.log("[v0] Extension context invalidated, skipping Chrome API call")
      fallback()
      return false
    }

    try {
      callback()
      return true
    } catch (error) {
      if (error.message && error.message.includes("Extension context invalidated")) {
        console.log("[v0] Extension context invalidated during API call")
        fallback()
        return false
      }
      throw error
    }
  }

  mapIncidentToDepartment(incidentType) {
    const departmentMap = {
      accident: "police",
      fire: "fire",
      pothole: "public-works",
      garbage: "public-works",
      pollution: "environmental",
      traffic: "police",
    }
    return departmentMap[incidentType] || "public-works"
  }

  detectPlatform() {
    const hostname = window.location.hostname
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "Twitter/X"
    if (hostname.includes("facebook.com")) return "Facebook"
    if (hostname.includes("instagram.com")) return "Instagram"
    if (hostname.includes("linkedin.com")) return "LinkedIn"
    return "Unknown"
  }

  async storeComplaintForAdmin(complaintData) {
    return new Promise((resolve) => {
      window.chrome.storage.local.get(["adminComplaints"], (result) => {
        const complaints = result.adminComplaints || []
        complaints.unshift(complaintData)

        if (complaints.length > 500) {
          complaints.splice(500)
        }

        window.chrome.storage.local.set({ adminComplaints: complaints }, () => {
          console.log("[v0] Complaint stored for admin access")
          resolve()
        })
      })
    })
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[v0] DOM loaded, initializing IncidentAnalyzer")
    window.incidentAnalyzer = new IncidentAnalyzer()
  })
} else {
  console.log("[v0] DOM already ready, initializing IncidentAnalyzer")
  window.incidentAnalyzer = new IncidentAnalyzer()
}

if (typeof window.chrome !== "undefined" && window.chrome.runtime) {
  try {
    window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!window.chrome.runtime.id) {
        console.log("[v0] Extension context invalidated, ignoring message")
        return false
      }

      if (request.action === "triggerAnalysis") {
        console.log("[v0] Manual analysis triggered from popup")
        if (typeof window.incidentAnalyzer === "undefined") {
          window.incidentAnalyzer = new IncidentAnalyzer()
        }
        window.incidentAnalyzer.performAnalysis()
        sendResponse({ success: true })
        return true
      }
      return false
    })
  } catch (error) {
    console.log("[v0] Error setting up message listener:", error)
  }
}
