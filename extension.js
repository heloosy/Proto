// Extension integration for the website
class WebsiteExtensionBridge {
  constructor() {
    this.init()
  }

  init() {
    console.log("[Website Bridge] Initializing extension bridge")
    this.setupMessageListener()
    this.pollExtensionData()
  }

  setupMessageListener() {
    // Listen for messages from extension content scripts
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === "EXTENSION_COMPLAINT") {
        console.log("[Website Bridge] Received complaint from extension:", event.data.complaint)
        this.handleExtensionComplaint(event.data.complaint)
      }
    })
  }

  pollExtensionData() {
    // Poll localStorage for extension data every 3 seconds
    setInterval(() => {
      this.checkExtensionComplaints()
    }, 3000)
  }

  checkExtensionComplaints() {
    try {
      const extensionComplaints = JSON.parse(localStorage.getItem("extensionComplaints") || "[]")
      const lastCheck = localStorage.getItem("websiteLastExtensionCheck") || "0"
      
      const newComplaints = extensionComplaints.filter(
        (c) => new Date(c.timestamp).getTime() > parseInt(lastCheck)
      )

      if (newComplaints.length > 0) {
        console.log("[Website Bridge] Found new extension complaints:", newComplaints.length)
        newComplaints.forEach(complaint => this.handleExtensionComplaint(complaint))
        localStorage.setItem("websiteLastExtensionCheck", Date.now().toString())
      }
    } catch (error) {
      console.log("[Website Bridge] Error checking extension complaints:", error)
    }
  }

  handleExtensionComplaint(extensionComplaint) {
    // Notify the main website script
    window.postMessage({
      type: "EXTENSION_COMPLAINT",
      complaint: extensionComplaint
    }, window.location.origin)

    // Show notification
    this.showExtensionNotification(extensionComplaint)
  }

  showExtensionNotification(complaint) {
    const notification = document.createElement("div")
    notification.className = "auto-complaint-notification"
    notification.innerHTML = `
      <div class="notification-content">
        <strong>🚨 Extension Alert!</strong>
        <span>New ${complaint.severity} ${complaint.type} detected</span>
        <small>Location: ${complaint.location || "Unknown"}</small>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 5000)
  }
}

// Initialize the bridge when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.websiteExtensionBridge = new WebsiteExtensionBridge()
  })
} else {
  window.websiteExtensionBridge = new WebsiteExtensionBridge()
}