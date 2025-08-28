
class AdminBridge {
  constructor() {
    this.adminUrl = ""
    this.reports = []
    this.init()
  }

  async init() {
    console.log("[v0] Admin Bridge initializing...")
    await this.loadConfig()
    this.setupMessageListener()
    this.startReportPolling()
    this.updateStatus("Bridge active - listening for reports")
  }

  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(["adminUrl"])
      this.adminUrl = result.adminUrl || ""
      document.getElementById("adminUrl").value = this.adminUrl
      console.log("[v0] Loaded admin URL:", this.adminUrl)
    } catch (error) {
      console.error("[v0] Error loading config:", error)
    }
  }

  setupMessageListener() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[v0] Bridge received message:", message)

      if (message.action === "NEW_COMPLAINT") {
        this.handleNewComplaint(message.complaint)
        sendResponse({ success: true })
      }

      return true
    })
  }

  async handleNewComplaint(complaint) {
    console.log("[v0] Processing new complaint:", complaint)

    // Add to local reports
    this.reports.unshift({
      ...complaint,
      receivedAt: new Date().toISOString(),
      id: Date.now(),
    })

    // Keep only last 50 reports
    if (this.reports.length > 50) {
      this.reports = this.reports.slice(0, 50)
    }

    this.updateReportsDisplay()

    // Send to admin website if configured
    if (this.adminUrl) {
      await this.sendToAdminWebsite(complaint)
    }
  }

  async sendToAdminWebsite(complaint) {
    try {
      console.log("[v0] Sending complaint to admin website:", this.adminUrl)

      if (this.adminUrl.startsWith("file://")) {
        // For local files, store data in localStorage and open the file
        const complaints = JSON.parse(localStorage.getItem("extensionComplaints") || "[]")
        complaints.unshift({
          ...complaint,
          timestamp: new Date().toISOString(),
          source: "extension",
          id: Date.now(),
        })

        // Keep only last 100 complaints
        if (complaints.length > 100) {
          complaints.splice(100)
        }

        localStorage.setItem("extensionComplaints", JSON.stringify(complaints))
        console.log("[v0] Stored complaint in localStorage for local admin file")
        this.updateStatus(`Report stored for local admin file - ${new Date().toLocaleTimeString()}`)

        // Optionally open the admin file in a new tab
        chrome.tabs.create({ url: this.adminUrl })
        return
      }

      const response = await fetch(`${this.adminUrl}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Source": "incident-analyzer-extension",
        },
        body: JSON.stringify({
          ...complaint,
          timestamp: new Date().toISOString(),
          source: "extension",
        }),
      })

      if (response.ok) {
        console.log("[v0] Successfully sent complaint to admin website")
        this.updateStatus(`Report sent to admin website - ${new Date().toLocaleTimeString()}`)
      } else {
        console.error("[v0] Failed to send complaint:", response.status)
        this.updateStatus(`Failed to send report: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error sending to admin website:", error)
      this.updateStatus(`Connection error: ${error.message}`)
    }
  }

  async startReportPolling() {
    // Poll for stored complaints every 5 seconds
    setInterval(async () => {
      try {
        const result = await chrome.storage.local.get(["adminComplaints"])
        const storedComplaints = result.adminComplaints || []

        // Process any new complaints
        storedComplaints.forEach((complaint) => {
          if (!this.reports.find((r) => r.id === complaint.id)) {
            this.handleNewComplaint(complaint)
          }
        })
      } catch (error) {
        console.error("[v0] Error polling reports:", error)
      }
    }, 5000)
  }

  updateReportsDisplay() {
    const reportsList = document.getElementById("reportsList")
    const reportCount = document.getElementById("reportCount")

    reportCount.textContent = `(${this.reports.length})`

    reportsList.innerHTML = this.reports
      .map(
        (report) => `
            <div class="report-item">
                <strong>${report.title || "Incident Report"}</strong><br>
                <small>Type: ${report.type} | Severity: ${report.severity} | ${new Date(report.receivedAt).toLocaleString()}</small><br>
                ${report.description || report.text || "No description"}
            </div>
        `,
      )
      .join("")
  }

  updateStatus(message) {
    document.getElementById("status").textContent = message
    console.log("[v0] Status:", message)
  }
}

// Global functions for HTML buttons
async function saveConfig() {
  const adminUrl = document.getElementById("adminUrl").value.trim()

  if (adminUrl && !adminUrl.startsWith("http") && !adminUrl.startsWith("file://")) {
    alert("Please enter a valid URL starting with http://, https://, or file://")
    return
  }

  try {
    await chrome.storage.sync.set({ adminUrl })
    window.adminBridge.adminUrl = adminUrl
    window.adminBridge.updateStatus("Configuration saved successfully")
    console.log("[v0] Admin URL saved:", adminUrl)
  } catch (error) {
    console.error("[v0] Error saving config:", error)
    window.adminBridge.updateStatus("Error saving configuration")
  }
}

async function testConnection() {
  const adminUrl = document.getElementById("adminUrl").value.trim()

  if (!adminUrl) {
    alert("Please enter an admin website URL first")
    return
  }

  try {
    window.adminBridge.updateStatus("Testing connection...")

    if (adminUrl.startsWith("file://")) {
      // For local files, just try to open them
      chrome.tabs.create({ url: adminUrl })
      window.adminBridge.updateStatus("Local file opened - connection test successful!")
      return
    }

    const response = await fetch(`${adminUrl}/api/test`, {
      method: "GET",
      headers: {
        "X-Source": "incident-analyzer-extension",
      },
    })

    if (response.ok) {
      window.adminBridge.updateStatus("Connection test successful!")
    } else {
      window.adminBridge.updateStatus(`Connection test failed: ${response.status}`)
    }
  } catch (error) {
    console.error("[v0] Connection test error:", error)
    window.adminBridge.updateStatus(`Connection test failed: ${error.message}`)
  }
}

// Initialize bridge when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.adminBridge = new AdminBridge()

  document.getElementById("saveConfigBtn").addEventListener("click", saveConfig)
  document.getElementById("testConnectionBtn").addEventListener("click", testConnection)
})
