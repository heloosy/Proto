class AdminDashboard {
  constructor() {
    this.notifications = []
    this.currentSection = "overview"
    this.extensionId = null // Added extension ID for web API communication
    this.chrome = window.chrome // Declare chrome variable

    // Load data from localStorage (coming from index.html when users register or raise complaints)
    this.users = JSON.parse(localStorage.getItem("users")) || []
    this.complaints = JSON.parse(localStorage.getItem("complaints")) || []

    console.log("[v0] Dashboard initialized with data:", {
      users: this.users.length,
      complaints: this.complaints.length,
    })

    // Cache DOM elements
    this.criticalCountEl = document.getElementById("criticalCount")
    this.highCountEl = document.getElementById("highCount")
    this.mediumCountEl = document.getElementById("mediumCount")
    this.userCountEl = document.getElementById("userCount")
    this.notificationsList = document.getElementById("notificationsList")
    this.recentActivity = document.getElementById("recentActivity")
    this.complaintsBody = document.getElementById("complaintsBody")
    this.usersBody = document.getElementById("usersBody")

    this.init()
    this.setupEventListeners()
    this.startRealTimeUpdates()
  }

  init() {
    this.loadData()
    this.updateStats()
    this.renderComplaints()
    this.renderUsers()
    this.renderNotifications()
    this.checkCriticalComplaints()
    this.loadExtensionData() // Load extension data
  }

  loadExtensionData() {
    console.log("[v0] Loading extension data...")
    this.loadExtensionDataFromLocalStorage()
    this.loadExtensionDataFromChromeAPI()
  }

  loadExtensionDataFromChromeAPI() {
    // Check if we're running in extension context
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
      console.log("[v0] Running in extension context, loading data from Chrome API")
      
      window.chrome.runtime.sendMessage({ action: "getExtensionData" }, (response) => {
        if (window.chrome.runtime.lastError) {
          console.log("[v0] Chrome API error:", window.chrome.runtime.lastError.message)
          return
        }
        
        if (response && response.success) {
          console.log("[v0] Received data from Chrome API:", response.complaints.length, "complaints")
          
          // Process complaints from extension
          response.complaints.forEach((complaint) => {
            const existingComplaint = this.complaints.find((c) => c.id === complaint.id)
            if (!existingComplaint) {
              console.log("[v0] Processing new Chrome API complaint:", complaint.title)
              this.complaints.unshift(complaint)
              this.createNotification({
                type: complaint.severity,
                title: `New ${complaint.severity} incident detected`,
                message: `${complaint.type} incident from ${complaint.socialMediaPlatform || "Social Media"}`,
                details: complaint.location || "Location not specified",
                time: new Date(complaint.timestamp).toLocaleTimeString(),
              })
            }
          })
          
          // Process incidents
          response.incidents.forEach((incident) => {
            const existingComplaint = this.complaints.find(
              (c) => c.source === "extension" && c.time === incident.timestamp
            )
            
            if (!existingComplaint) {
              const processedComplaint = {
                id: `inc_${incident.timestamp}_${this.generateId()}`,
                type: incident.type || "General",
                severity: incident.severity || "medium",
                department: this.categorizeDepartment(incident),
                location: incident.location || "Social Media",
                time: incident.timestamp,
                source: "extension",
                status: "pending",
                description: incident.text || "",
                user: "Extension Auto-Detection",
                impactScore: incident.impactScore || 0,
                confidence: incident.confidence || 0,
                url: incident.url || "",
                postUrl: incident.postUrl || "",
                keywords: incident.keywords || [],
                socialMediaPlatform: this.detectPlatformFromUrl(incident.url),
              }
              
              this.complaints.unshift(processedComplaint)
            }
          })
          
          this.updateStats()
          this.renderComplaints()
          this.updateDepartmentStats()
          this.renderNotifications()
        }
      })
    } else {
      console.log("[v0] Not running in extension context, using localStorage only")
    }
  }

  loadExtensionDataViaWebAPI() {
    if (!this.extensionId) {
      console.log("[v0] No extension ID available for web API")
      return
    }

    if (!window.chrome || !window.chrome.runtime) {
      console.log("[v0] Chrome runtime API not available - admin page is running as website")
      console.log("[v0] Falling back to localStorage method")
      this.loadExtensionDataFromLocalStorage()
      return
    }

    try {
      window.chrome.runtime.sendMessage(this.extensionId, { action: "getComplaintsForWeb" }, (response) => {
        if (window.chrome.runtime.lastError) {
          console.log("[v0] Extension API error:", window.chrome.runtime.lastError.message)
          console.log("[v0] Falling back to localStorage method")
          this.loadExtensionDataFromLocalStorage()
          return
        }

        if (response && response.success) {
          console.log("[v0] Successfully received data from extension via web API")
          console.log("[v0] Complaints received:", response.complaints.length)

          // Process complaints from extension
          response.complaints.forEach((complaint) => {
            const existingComplaint = this.complaints.find((c) => c.id === complaint.id)
            if (!existingComplaint) {
              console.log("[v0] Processing new web API complaint:", complaint.title)
              this.complaints.unshift(complaint)
              this.createNotification({
                type: complaint.severity,
                title: `New ${complaint.severity} incident detected`,
                message: `${complaint.type} incident from ${complaint.socialMediaPlatform || "Social Media"}`,
                details: complaint.location || "Location not specified",
                time: new Date(complaint.timestamp).toLocaleTimeString(),
              })
              console.log("[v0] Report successfully received by admin dashboard via web API:", complaint.type)
            }
          })

          this.updateStats()
          this.renderComplaints()
          this.updateDepartmentStats()
          this.renderNotifications()
        } else {
          console.log("[v0] No data received from extension web API")
        }
      })
    } catch (error) {
      console.log("[v0] Error calling extension web API:", error)
      this.loadExtensionDataFromLocalStorage()
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = btn.getAttribute("data-section")
        console.log("[v0] Navigation clicked:", section)
        this.showSection(section)
      })
    })

    // Filters
    const severityFilter = document.getElementById("severityFilter")
    const departmentFilter = document.getElementById("departmentFilter")
    const sourceFilter = document.getElementById("sourceFilter")

    if (severityFilter) severityFilter.addEventListener("change", () => this.filterComplaints())
    if (departmentFilter) departmentFilter.addEventListener("change", () => this.filterComplaints())
    if (sourceFilter) sourceFilter.addEventListener("change", () => this.filterComplaints())

    // Listen for new complaints from extension and website
    this.setupComplaintListener()
  }

  setupComplaintListener() {
    try {
      // Listen for messages from extension
      window.addEventListener("message", (event) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === "NEW_COMPLAINT" || event.data.type === "EXTENSION_COMPLAINT") {
          console.log("[v0] Received complaint via postMessage:", event.data.complaint)
          this.handleNewComplaint(event.data.complaint)
        }

        if (event.data.type === "EXTENSION_COMPLAINTS") {
          console.log("[v0] Received multiple complaints via postMessage:", event.data.complaints.length)
          event.data.complaints.forEach((complaint) => this.handleNewComplaint(complaint))
        }
      })
      
      console.log("[v0] PostMessage listener setup successfully")
    } catch (error) {
      console.log("[v0] Message listener setup failed:", error)
    }

    // Poll for new data every 2 seconds
    setInterval(() => {
      this.checkForNewComplaints()
      this.loadExtensionDataFromLocalStorage()
    }, 2000)
  }

  loadExtensionData() {
    if (this.extensionId) {
      this.loadExtensionDataViaWebAPI()
    } else {
      this.loadExtensionDataFromLocalStorage()
    }
  }

  loadExtensionDataFromLocalStorage() {
    try {
      const extensionComplaints = JSON.parse(localStorage.getItem("extensionComplaints") || "[]")
      const extensionIncidents = JSON.parse(localStorage.getItem("extensionIncidents") || "[]")

      console.log(
        "[v0] Loading from localStorage - complaints:",
        extensionComplaints.length,
        "incidents:",
        extensionIncidents.length,
      )

      // Process extension complaints
      extensionComplaints.forEach((complaint) => {
        const existingComplaint = this.complaints.find((c) => c.id === complaint.id)
        if (!existingComplaint) {
          console.log("[v0] Processing new localStorage complaint:", complaint.title)
          this.complaints.unshift(complaint)
          this.createNotification({
            type: complaint.severity,
            title: `New ${complaint.severity} incident detected`,
            message: `${complaint.type} incident from ${complaint.socialMediaPlatform || "Social Media"}`,
            details: complaint.location || "Location not specified",
            time: new Date(complaint.timestamp).toLocaleTimeString(),
          })
          console.log("[v0] Report successfully received by admin dashboard:", complaint.type)
        }
      })

      // Process extension incidents
      extensionIncidents.forEach((incident) => {
        const existingComplaint = this.complaints.find(
          (c) =>
            c.source === "extension" &&
            c.time === incident.timestamp &&
            c.description.includes(incident.text?.substring(0, 50)),
        )

        if (!existingComplaint) {
          const processedComplaint = {
            id: `inc_${incident.timestamp}_${this.generateId()}`,
            type: incident.type || "General",
            severity: incident.severity || "medium",
            department: this.categorizeDepartment(incident),
            location: incident.location || "Social Media",
            time: incident.timestamp,
            source: "extension",
            status: "pending",
            description: incident.text || "",
            user: "Extension Auto-Detection",
            impactScore: incident.impactScore || 0,
            confidence: incident.confidence || 0,
            url: incident.url || "",
            postUrl: incident.postUrl || "",
            keywords: incident.keywords || [],
            socialMediaPlatform: this.detectPlatformFromUrl(incident.url),
          }

          this.complaints.unshift(processedComplaint)
        }
      })

      this.updateStats()
      this.renderComplaints()
      this.updateDepartmentStats()
      this.renderNotifications()
    } catch (error) {
      console.log("[v0] Error loading extension data from localStorage:", error)
    }
  }

  showStorageUnavailableMessage() {
    const container = document.getElementById("complaintsBody")
    if (container && this.complaints.length === 0) {
      container.innerHTML = `
        <div class="storage-unavailable-message">
          <h3>⚠️ Extension Storage Not Available</h3>
          <p>To view extension reports, please open this admin page from the extension:</p>
          <ol>
            <li>Click the extension icon in your browser toolbar</li>
            <li>Click "Open Admin Dashboard" button</li>
          </ol>
          <p>This will ensure proper access to Chrome extension storage.</p>
        </div>
      `
    }
  }

  handleNewComplaint(complaint) {
    console.log("[v0] New complaint received:", complaint)
    console.log("[v0] Report successfully received by admin dashboard:", complaint.type)

    // Check if complaint already exists
    const existingComplaint = this.complaints.find((c) => c.id === complaint.id)
    if (existingComplaint) {
      console.log("[v0] Complaint already exists, skipping")
      return
    }

    // Process and add the complaint
    const processedComplaint = {
      ...complaint,
      department: complaint.department || this.categorizeDepartment(complaint),
      status: complaint.status || "pending",
      time: complaint.timestamp || complaint.time || new Date().toISOString(),
    }

    this.complaints.unshift(processedComplaint)

    console.log("[v0] Complaint successfully processed and added to admin dashboard")

    // Create notification
    this.createNotification({
      type: complaint.severity || "medium",
      title: `New ${complaint.source} complaint`,
      message: `${complaint.type} - ${complaint.severity} priority`,
      details: complaint.location || "Location not specified",
      time: new Date().toLocaleTimeString(),
    })

    // Update UI
    this.updateStats()
    this.renderComplaints()
    this.updateDepartmentStats()
    this.renderNotifications()

    // Handle critical complaints
    if (complaint.severity === "critical") {
      this.showCriticalPopup(complaint)
      this.playNotificationSound()
    }
  }

  createNotification(notificationData) {
    const notification = {
      id: this.generateId(),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      details: notificationData.details,
      time: notificationData.time,
      timestamp: new Date().toISOString(),
      read: false,
    }

    this.notifications.unshift(notification)

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications.splice(50)
    }

    this.renderNotifications()
    console.log("[v0] Notification created:", notification.title)
  }

  categorizeDepartment(incident) {
    const departmentMap = {
      accident: "police",
      fire: "fire",
      pothole: "public-works",
      garbage: "public-works",
      pollution: "environmental",
      traffic: "police",
    }

    if (incident.type) {
      return departmentMap[incident.type.toLowerCase()] || "public-works"
    }

    return "public-works"
  }

  detectPlatformFromUrl(url) {
    if (!url) return "Unknown"
    if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter/X"
    if (url.includes("facebook.com")) return "Facebook"
    if (url.includes("instagram.com")) return "Instagram"
    if (url.includes("linkedin.com")) return "LinkedIn"
    return "Social Media"
  }

  showCriticalPopup(complaint) {
    const popup = document.createElement("div")
    popup.className = "critical-alert-popup"
    popup.innerHTML = `
      <div class="critical-alert-content">
        <div class="critical-alert-header">
          <h3>🚨 CRITICAL INCIDENT ALERT</h3>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">×</button>
        </div>
        <div class="critical-alert-body">
          <p><strong>Type:</strong> ${complaint.type}</p>
          <p><strong>Location:</strong> ${complaint.location}</p>
          <p><strong>Source:</strong> ${complaint.source}</p>
          <p><strong>Time:</strong> ${new Date(complaint.time).toLocaleString()}</p>
          ${complaint.description ? `<p><strong>Description:</strong> ${complaint.description.substring(0, 200)}...</p>` : ""}
          ${complaint.postUrl ? `<p><strong>Source Post:</strong> <a href="${complaint.postUrl}" target="_blank">View Original</a></p>` : ""}
        </div>
        <div class="critical-alert-actions">
          <button onclick="window.adminDashboard.assignComplaint('${complaint.id}')" class="btn-assign">Assign Department</button>
          <button onclick="window.adminDashboard.viewComplaint('${complaint.id}')" class="btn-view">View Details</button>
        </div>
      </div>
    `

    document.body.appendChild(popup)

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (popup.parentElement) {
        popup.parentElement.removeChild(popup)
      }
    }, 30000)
  }

  assignComplaint(complaintId) {
    const complaint = this.complaints.find((c) => c.id === complaintId)
    if (!complaint) return

    const department = prompt(
      `Assign complaint to department:\n\n1. Fire Department\n2. Police\n3. Medical Services\n4. Public Works\n5. Environmental\n\nEnter number (1-5):`,
    )

    const departmentMap = {
      1: "fire",
      2: "police",
      3: "medical",
      4: "public-works",
      5: "environmental",
    }

    if (departmentMap[department]) {
      complaint.department = departmentMap[department]
      complaint.status = "assigned"
      complaint.assignedAt = new Date().toISOString()

      this.renderComplaints()
      this.updateDepartmentStats()

      alert(`Complaint assigned to ${this.getDepartmentName(departmentMap[department])}`)
    }
  }

  filterComplaints() {
    const severityFilter = document.getElementById("severityFilter").value
    const departmentFilter = document.getElementById("departmentFilter").value
    const sourceFilter = document.getElementById("sourceFilter").value

    let filteredComplaints = [...this.complaints]

    if (severityFilter !== "all") {
      filteredComplaints = filteredComplaints.filter((c) => c.severity === severityFilter)
    }

    if (departmentFilter !== "all") {
      filteredComplaints = filteredComplaints.filter((c) => c.department === departmentFilter)
    }

    if (sourceFilter !== "all") {
      filteredComplaints = filteredComplaints.filter((c) => c.source === sourceFilter)
    }

    this.renderFilteredComplaints(filteredComplaints)
  }

  renderFilteredComplaints(complaints) {
    const container = document.getElementById("complaintsBody")
    if (!container) return

    if (complaints.length === 0) {
      container.innerHTML = '<div class="no-complaints">No complaints match the selected filters</div>'
      return
    }

    const sortedComplaints = [...complaints].sort((a, b) => new Date(b.time) - new Date(a.time))

    container.innerHTML = sortedComplaints
      .map(
        (complaint) => `
            <div class="table-row">
                <div>${complaint.id}</div>
                <div>${complaint.type}</div>
                <div><span class="severity-badge ${complaint.severity}">${complaint.severity}</span></div>
                <div>${this.getDepartmentName(complaint.department)}</div>
                <div>${complaint.location}</div>
                <div>${new Date(complaint.time).toLocaleString()}</div>
                <div><span class="source-badge ${complaint.source}">${complaint.source}</span></div>
                <div><span class="status-badge ${complaint.status}">${complaint.status}</span></div>
                <div>
                    <button class="action-btn view" onclick="window.adminDashboard.viewComplaint('${complaint.id}')">View</button>
                    <button class="action-btn edit" onclick="window.adminDashboard.updateComplaintStatus('${complaint.id}')">Update</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  updateComplaintStatus(complaintId) {
    const complaint = this.complaints.find((c) => c.id === complaintId)
    if (!complaint) return

    const newStatus = prompt(
      `Update complaint status:\n\nCurrent: ${complaint.status}\n\n1. Pending\n2. Assigned\n3. In Progress\n4. Resolved\n5. Closed\n\nEnter number (1-5):`,
    )

    const statusMap = {
      1: "pending",
      2: "assigned",
      3: "in-progress",
      4: "resolved",
      5: "closed",
    }

    if (statusMap[newStatus]) {
      complaint.status = statusMap[newStatus]
      complaint.updatedAt = new Date().toISOString()

      // Update extension storage if it's an extension complaint
      if (complaint.source === "extension" && window.chrome && window.chrome.runtime) {
        window.chrome.runtime.sendMessage({
          action: "updateComplaintStatus",
          complaintId: complaint.id,
          status: statusMap[newStatus],
        })
      }

      this.renderComplaints()
      this.updateStats()

      alert(`Complaint status updated to: ${statusMap[newStatus]}`)
    }
  }

  checkForNewComplaints() {
    try {
      const websiteComplaints = JSON.parse(localStorage.getItem("complaints") || "[]")
      const websiteUsers = JSON.parse(localStorage.getItem("users") || "[]")

      const lastCheck = localStorage.getItem("adminLastCheck") || "0"
      const newComplaints = websiteComplaints.filter(
        (c) => new Date(c.createdAt).getTime() > Number.parseInt(lastCheck),
      )

      const lastUserCheck = localStorage.getItem("adminLastUserCheck") || "0"
      const newUsers = websiteUsers.filter((u) => new Date(u.createdAt).getTime() > Number.parseInt(lastUserCheck))

      newComplaints.forEach((complaint) => {
        this.handleNewComplaint({
          id: complaint.id,
          type: complaint.title || complaint.type,
          description: complaint.description,
          location: complaint.location,
          severity: this.mapPriorityToSeverity(complaint.priority),
          source: complaint.source || "website",
          timestamp: complaint.createdAt,
          user: this.getUserEmail(complaint.userId),
        })
      })

      if (newUsers.length > 0) {
        console.log("[v0] New users registered:", newUsers.length)
        this.loadData()
        this.renderUsers()
        this.updateStats()
      }

      if (newComplaints.length > 0) {
        localStorage.setItem("adminLastCheck", Date.now().toString())
        console.log("[v0] Processed", newComplaints.length, "new complaints from website")
      }

      if (newUsers.length > 0) {
        localStorage.setItem("adminLastUserCheck", Date.now().toString())
      }
    } catch (error) {
      console.error("[v0] Error checking for new data:", error)
    }
  }

  showSection(sectionName) {
    console.log("[v0] Switching to section:", sectionName)

    // Hide all sections
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.remove("active")
    })

    // Remove active class from all nav buttons
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active")
    })

    // Show selected section
    const section = document.getElementById(sectionName)
    if (section) {
      section.classList.add("active")
      console.log("[v0] Section activated:", sectionName)
    } else {
      console.log("[v0] Section not found:", sectionName)
    }

    const navBtn = document.querySelector(`[data-section="${sectionName}"]`)
    if (navBtn) {
      navBtn.classList.add("active")
      console.log("[v0] Nav button activated for:", sectionName)
    } else {
      console.log("[v0] Nav button not found for section:", sectionName)
    }

    this.currentSection = sectionName

    if (sectionName === "complaints") {
      this.loadData()
      this.renderComplaints()
    } else if (sectionName === "users") {
      this.loadData()
      this.renderUsers()
    } else if (sectionName === "departments") {
      this.updateDepartmentStats()
    } else if (sectionName === "overview") {
      this.loadData()
      this.updateStats()
      this.renderNotifications()
    }
  }

  loadData() {
    try {
      // Load real users from website
      this.users = JSON.parse(localStorage.getItem("users")) || []
      this.complaints = JSON.parse(localStorage.getItem("complaints")) || []

      console.log("[v0] Loaded real data:", {
        users: this.users.length,
        complaints: this.complaints.length,
      })
    } catch (error) {
      console.error("[v0] Error loading real data:", error)
      // Fallback to empty arrays if there's an error
      this.users = []
      this.complaints = []
    }
  }

  updateStats() {
    const stats = this.calculateStats()

    if (this.criticalCountEl) this.criticalCountEl.textContent = stats.critical
    if (this.highCountEl) this.highCountEl.textContent = stats.high
    if (this.mediumCountEl) this.mediumCountEl.textContent = stats.medium
    if (this.userCountEl) this.userCountEl.textContent = stats.users

    const totalUsersEl = document.getElementById("totalUsers")
    const activeUsersEl = document.getElementById("activeUsers")
    const newUsersEl = document.getElementById("newUsers")

    if (totalUsersEl) totalUsersEl.textContent = this.users.length
    if (activeUsersEl) activeUsersEl.textContent = this.users.filter((u) => u.status === "active").length
    if (newUsersEl)
      newUsersEl.textContent = this.users.filter(
        (u) => new Date(u.registrationDate).toDateString() === new Date().toDateString(),
      ).length
  }

  calculateStats() {
    const today = new Date().toDateString()
    const todayComplaints = this.complaints.filter((c) => new Date(c.time).toDateString() === today)

    return {
      critical: this.complaints.filter((c) => c.priority === "critical" || c.severity === "critical").length,
      high: this.complaints.filter((c) => c.priority === "high" || c.severity === "high").length,
      medium: this.complaints.filter((c) => c.priority === "medium" || c.severity === "medium").length,
      users: this.users.length,
      todayCritical: todayComplaints.filter((c) => c.priority === "critical" || c.severity === "critical").length,
      todayHigh: todayComplaints.filter((c) => c.priority === "high" || c.severity === "high").length,
      todayMedium: todayComplaints.filter((c) => c.priority === "medium" || c.severity === "medium").length,
    }
  }

  renderNotifications() {
    const container = document.getElementById("notificationsList")
    if (!container) return

    if (this.notifications.length === 0) {
      container.innerHTML = '<div class="no-notifications">No new notifications</div>'
      return
    }

    container.innerHTML = this.notifications
      .slice(0, 10)
      .map(
        (notification) => `
            <div class="notification-item ${notification.type}">
                <div class="notification-badge ${notification.type}">${notification.type}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-details">${notification.message}</div>
                    <div class="notification-details">${notification.details}</div>
                </div>
                <div class="notification-time">${notification.time}</div>
            </div>
        `,
      )
      .join("")
  }

  renderComplaints() {
    const container = document.getElementById("complaintsBody")
    if (!container) return

    if (this.complaints.length === 0) {
      container.innerHTML = '<div class="no-complaints">No complaints found</div>'
      return
    }

    const sortedComplaints = [...this.complaints].sort((a, b) => new Date(b.time) - new Date(a.time))

    container.innerHTML = sortedComplaints
      .map(
        (complaint) => `
            <div class="table-row">
                <div>${complaint.id}</div>
                <div>${complaint.type}</div>
                <div><span class="severity-badge ${complaint.severity}">${complaint.severity}</span></div>
                <div>${this.getDepartmentName(complaint.department)}</div>
                <div>${complaint.location}</div>
                <div>${new Date(complaint.time).toLocaleString()}</div>
                <div><span class="source-badge ${complaint.source}">${complaint.source}</span></div>
                <div><span class="status-badge ${complaint.status}">${complaint.status}</span></div>
                <div>
                    <button class="action-btn view" onclick="window.adminDashboard.viewComplaint('${complaint.id}')">View</button>
                    <button class="action-btn edit" onclick="window.adminDashboard.updateComplaintStatus('${complaint.id}')">Update</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  renderUsers() {
    const container = document.getElementById("usersBody")
    if (!container) return

    if (this.users.length === 0) {
      container.innerHTML = '<div class="no-users">No users found</div>'
      return
    }

    container.innerHTML = this.users
      .map(
        (user) => `
            <div class="table-row">
                <div>${user.id}</div>
                <div>${user.name}</div>
                <div>${user.email}</div>
                <div>${user.phone}</div>
                <div>${new Date(user.registrationDate).toLocaleDateString()}</div>
                <div>${user.complaints}</div>
                <div><span class="status-badge ${user.status}">${user.status}</span></div>
                <div>
                    <button class="action-btn view" onclick="window.adminDashboard.viewUser('${user.id}')">View</button>
                    <button class="action-btn edit" onclick="window.adminDashboard.editUser('${user.id}')">Edit</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  mapPriorityToSeverity(priority) {
    const mapping = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    }
    return mapping[priority] || "medium"
  }

  getUserEmail(userId) {
    const user = this.users.find((u) => u.id == userId)
    return user ? user.email : null
  }

  getDepartmentName(dept) {
    const names = {
      fire: "Fire Dept",
      police: "Police",
      medical: "Medical",
      "public-works": "Public Works",
      environmental: "Environmental",
    }
    return names[dept] || dept
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  viewComplaint(id) {
    const complaint = this.complaints.find((c) => c.id === id)
    if (complaint) {
      let details = `Complaint Details:\n\nID: ${complaint.id}\nType: ${complaint.type}\nSeverity: ${complaint.severity}\nLocation: ${complaint.location}\nSource: ${complaint.source}\nDescription: ${complaint.description}`

      if (complaint.source === "extension") {
        details += `\n\nExtension Data:\nImpact Score: ${complaint.impactScore || "N/A"}\nConfidence: ${complaint.confidence || "N/A"}\nSource URL: ${complaint.url || "N/A"}`
        if (complaint.postUrl) {
          details += `\nPost URL: ${complaint.postUrl}`
        }
        if (complaint.keywords && complaint.keywords.length > 0) {
          details += `\nKeywords: ${complaint.keywords.join(", ")}`
        }
        if (complaint.socialMediaPlatform) {
          details += `\nPlatform: ${complaint.socialMediaPlatform}`
        }
      }

      alert(details)
    }
  }

  editComplaint(id) {
    console.log("Edit complaint with ID:", id)
  }

  viewUser(id) {
    console.log("View user with ID:", id)
  }

  editUser(id) {
    console.log("Edit user with ID:", id)
  }

  updateDepartmentStats() {
    const departments = ["fire", "police", "medical", "public-works", "environmental"]

    departments.forEach((dept) => {
      const deptComplaints = this.complaints.filter((c) => c.department === dept)
      const active = deptComplaints.filter((c) => c.status === "assigned" || c.status === "in-progress").length
      const pending = deptComplaints.filter((c) => c.status === "pending").length
      const resolved = deptComplaints.filter((c) => c.status === "resolved" || c.status === "closed").length

      const activeEl = document.getElementById(`${dept.replace("-", "")}Active`)
      const pendingEl = document.getElementById(`${dept.replace("-", "")}Pending`)
      const resolvedEl = document.getElementById(`${dept.replace("-", "")}Resolved`)

      if (activeEl) activeEl.textContent = active
      if (pendingEl) pendingEl.textContent = pending
      if (resolvedEl) resolvedEl.textContent = resolved
    })
  }

  checkCriticalComplaints() {
    const criticalComplaints = this.complaints.filter((c) => c.severity === "critical" && c.status === "pending")

    if (criticalComplaints.length > 0) {
      console.log(`[v0] Found ${criticalComplaints.length} critical complaints requiring attention`)

      // Show alert for unhandled critical complaints
      criticalComplaints.forEach((complaint) => {
        if (!complaint.alertShown) {
          this.showCriticalPopup(complaint)
          complaint.alertShown = true
        }
      })
    }
  }

  playNotificationSound() {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
      )
      audio.play().catch(() => {
        // Ignore audio play errors
      })
    } catch (error) {
      console.log("[v0] Could not play notification sound:", error)
    }
  }

  startRealTimeUpdates() {
    setInterval(() => {
      this.loadExtensionDataFromLocalStorage()
      this.loadExtensionDataFromChromeAPI()
      this.checkForNewComplaints()
      this.checkCriticalComplaints()
    }, 5000)

    console.log("[v0] Real-time updates started - checking every 5 seconds")
  }

  logout() {
    if (confirm("Are you sure you want to logout?")) {
      window.location.href = "login.html"
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM loaded, initializing AdminDashboard...")
  window.adminDashboard = new AdminDashboard()
  console.log("[v0] AdminDashboard initialized and available globally")
})
