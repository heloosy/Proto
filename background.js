chrome.runtime.onInstalled.addListener(() => {
  console.log("Incident Analyzer Extension installed")

  // Initialize storage
  chrome.storage.local.set({
    incidents: [],
    analysisEnabled: true,
    pendingComplaints: [],
    adminComplaints: [],
  })
})

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveIncident") {
    chrome.storage.local.get(["incidents"], (result) => {
      const incidents = result.incidents || []
      incidents.unshift(request.incident)

      // Keep only last 100 incidents
      if (incidents.length > 100) {
        incidents.splice(100)
      }

      chrome.storage.local.set({ incidents: incidents })
      sendResponse({ success: true })
    })
    return true
  }

  if (request.type === "SEND_TO_ADMIN") {
    chrome.storage.local.get(["adminComplaints"], (result) => {
      const complaints = result.adminComplaints || []
      complaints.unshift(request.complaint)

      // Keep only last 500 complaints
      if (complaints.length > 500) {
        complaints.splice(500)
      }

      chrome.storage.local.set({ adminComplaints: complaints }, () => {
        console.log("[Background] Complaint stored for admin:", request.complaint.title)

        // Send to all admin tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (
              tab.url &&
              (tab.url.includes("localhost") || tab.url.includes("127.0.0.1") || tab.url.includes("admin"))
            ) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "NEW_COMPLAINT",
                  complaint: request.complaint,
                })
                .catch(() => {
                  // Ignore errors for tabs that can't receive messages
                })
            }
          })
        })

        sendResponse({ success: true })
      })
    })
    return true
  }

  if (request.action === "getAdminData") {
    chrome.storage.local.get(["adminComplaints", "incidents"], (result) => {
      const complaints = result.adminComplaints || []
      const incidents = result.incidents || []

      // Calculate statistics
      const stats = {
        total: complaints.length,
        critical: complaints.filter((c) => c.severity === "critical").length,
        high: complaints.filter((c) => c.severity === "high").length,
        medium: complaints.filter((c) => c.severity === "medium").length,
        low: complaints.filter((c) => c.severity === "low").length,
        byDepartment: {},
        bySource: {},
        recent: complaints.slice(0, 10),
      }

      // Calculate department stats
      complaints.forEach((complaint) => {
        stats.byDepartment[complaint.department] = (stats.byDepartment[complaint.department] || 0) + 1
        stats.bySource[complaint.source] = (stats.bySource[complaint.source] || 0) + 1
      })

      sendResponse({
        success: true,
        complaints: complaints,
        incidents: incidents,
        stats: stats,
      })
    })
    return true
  }

  if (request.action === "updateComplaintStatus") {
    chrome.storage.local.get(["adminComplaints"], (result) => {
      const complaints = result.adminComplaints || []
      const complaintIndex = complaints.findIndex((c) => c.id === request.complaintId)

      if (complaintIndex !== -1) {
        complaints[complaintIndex].status = request.status
        complaints[complaintIndex].updatedAt = new Date().toISOString()

        chrome.storage.local.set({ adminComplaints: complaints }, () => {
          sendResponse({ success: true })
        })
      } else {
        sendResponse({ success: false, error: "Complaint not found" })
      }
    })
    return true
  }

  if (request.action === "updateBadge") {
    const count = request.count || 0
    chrome.action.setBadgeText({
      text: count > 0 ? count.toString() : "",
    })
    chrome.action.setBadgeBackgroundColor({ color: "#ff4444" })
    sendResponse({ success: true })
    return true
  }
})

// Update badge with incident count
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.incidents) {
    const incidentCount = changes.incidents.newValue?.length || 0
    chrome.action.setBadgeText({
      text: incidentCount > 0 ? incidentCount.toString() : "",
    })
    chrome.action.setBadgeBackgroundColor({ color: "#ff4444" })
  }
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.pendingComplaints && changes.pendingComplaints.newValue) {
    const complaints = changes.pendingComplaints.newValue
    if (complaints.length > 0) {
      // Send to all website tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && (tab.url.includes("localhost") || tab.url.includes("127.0.0.1"))) {
            chrome.tabs
              .sendMessage(tab.id, {
                type: "EXTENSION_COMPLAINTS",
                complaints: complaints,
              })
              .catch(() => {
                // Ignore errors for tabs that can't receive messages
              })
          }
        })
      })

      // Clear pending complaints after sending
      chrome.storage.local.set({ pendingComplaints: [] })
    }
  }
})

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  // Allow admin websites to request complaint data
  if (request.action === "getComplaintsForWeb") {
    chrome.storage.local.get(["adminComplaints", "incidents"], (result) => {
      const complaints = result.adminComplaints || []
      const incidents = result.incidents || []

      console.log("[Background] Sending complaints to web admin:", complaints.length)

      sendResponse({
        success: true,
        complaints: complaints,
        incidents: incidents,
        timestamp: Date.now(),
      })
    })
    return true
  }

  if (request.action === "updateComplaintStatusWeb") {
    chrome.storage.local.get(["adminComplaints"], (result) => {
      const complaints = result.adminComplaints || []
      const complaintIndex = complaints.findIndex((c) => c.id === request.complaintId)

      if (complaintIndex !== -1) {
        complaints[complaintIndex].status = request.status
        complaints[complaintIndex].updatedAt = new Date().toISOString()

        chrome.storage.local.set({ adminComplaints: complaints }, () => {
          console.log("[Background] Updated complaint status via web API")
          sendResponse({ success: true })
        })
      } else {
        sendResponse({ success: false, error: "Complaint not found" })
      }
    })
    return true
  }
})
