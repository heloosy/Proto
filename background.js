chrome.runtime.onInstalled.addListener(() => {
  console.log("[Background] Incident Analyzer Extension installed")

  // Initialize storage
  chrome.storage.local.set({
    incidents: [],
    analysisEnabled: true,
    pendingComplaints: [],
    adminComplaints: [],
  })
})

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Background] Received message:", request.action)

  if (request.action === "saveIncident") {
    chrome.storage.local.get(["incidents"], (result) => {
      const incidents = result.incidents || []
      incidents.unshift(request.incident)

      // Keep only last 100 incidents
      if (incidents.length > 100) {
        incidents.splice(100)
      }

      chrome.storage.local.set({ incidents: incidents }, () => {
        console.log("[Background] Incident saved:", request.incident.type)
        
        // Update badge
        chrome.action.setBadgeText({
          text: incidents.length.toString(),
        })
        chrome.action.setBadgeBackgroundColor({ color: "#ff4444" })
        
        sendResponse({ success: true })
      })
    })
    return true
  }

  if (request.action === "NEW_COMPLAINT") {
    // Handle complaint from content script
    chrome.storage.local.get(["adminComplaints"], (result) => {
      const complaints = result.adminComplaints || []
      complaints.unshift(request.complaint)

      // Keep only last 500 complaints
      if (complaints.length > 500) {
        complaints.splice(500)
      }

      chrome.storage.local.set({ adminComplaints: complaints }, () => {
        console.log("[Background] Complaint stored for admin:", request.complaint.title)

        // Update badge
        chrome.action.setBadgeText({
          text: complaints.length.toString(),
        })
        chrome.action.setBadgeBackgroundColor({ color: "#ff4444" })

        sendResponse({ success: true })
      })
    })
    return true
  }

  if (request.action === "SEND_TO_ADMIN") {
    chrome.storage.local.get(["adminComplaints"], (result) => {
      const complaints = result.adminComplaints || []
      complaints.unshift(request.complaint)

      // Keep only last 500 complaints
      if (complaints.length > 500) {
        complaints.splice(500)
      }

      chrome.storage.local.set({ adminComplaints: complaints }, () => {
        console.log("[Background] Complaint stored for admin:", request.complaint.title)

        // Update badge
        chrome.action.setBadgeText({
          text: complaints.length.toString(),
        })
        chrome.action.setBadgeBackgroundColor({ color: "#ff4444" })

        sendResponse({ success: true })
      })
    })
    return true
  }

  if (request.action === "getAdminData") {
    chrome.storage.local.get(["adminComplaints", "incidents"], (result) => {
      const complaints = result.adminComplaints || []
      const incidents = result.incidents || []

      sendResponse({
        success: true,
        complaints: complaints,
        incidents: incidents,
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

  if (request.action === "triggerAnalysis") {
    // Forward to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerAnalysis" }, (response) => {
          sendResponse(response || { success: true })
        })
      } else {
        sendResponse({ success: false, error: "No active tab" })
      }
    })
    return true
  }

  if (request.action === "openAdminPage") {
    chrome.tabs.create({ url: chrome.runtime.getURL("admin.html") })
    sendResponse({ success: true })
    return true
  }

  if (request.action === "openBridgePage") {
    chrome.tabs.create({ url: chrome.runtime.getURL("bridge.html") })
    sendResponse({ success: true })
    return true
  }

  if (request.action === "getExtensionData") {
    chrome.storage.local.get(["adminComplaints", "incidents"], (result) => {
      sendResponse({
        success: true,
        complaints: result.adminComplaints || [],
        incidents: result.incidents || []
      })
    })
    return true
  }
})

// Handle external messages from web pages
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log("[Background] External message:", request.action, "from:", sender.origin)
  
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

// Update badge with incident count
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.incidents || changes.adminComplaints) {
    const incidentCount = changes.incidents?.newValue?.length || 0
    const complaintCount = changes.adminComplaints?.newValue?.length || 0
    const totalCount = incidentCount + complaintCount
    
    chrome.action.setBadgeText({
      text: totalCount > 0 ? totalCount.toString() : "",
    })
    chrome.action.setBadgeBackgroundColor({ color: "#ff4444" })
  }
})