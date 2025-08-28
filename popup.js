document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const totalIncidentsEl = document.getElementById("totalIncidents")
  const todayIncidentsEl = document.getElementById("todayIncidents")
  const criticalIncidentsEl = document.getElementById("criticalIncidents")
  const highIncidentsEl = document.getElementById("highIncidents")
  const incidentsListEl = document.getElementById("incidentsList")
  const toggleBtn = document.getElementById("toggleAnalysis")
  const manualAnalysisBtn = document.getElementById("manualAnalysis")
  const filterBtns = document.querySelectorAll(".filter-btn")
  const adminPageBtn = document.getElementById("adminPage")
  const bridgePageBtn = document.getElementById("bridgePage")

  let analysisEnabled = true
  let currentFilter = "all"

  // Declare chrome variable
  const chrome = window.chrome

  function isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id)
    } catch (error) {
      return false
    }
  }

  function safeChromeCall(callback, fallback = () => {}) {
    if (!isExtensionContextValid()) {
      console.log("Extension context invalidated, skipping Chrome API call")
      fallback()
      return false
    }

    try {
      callback()
      return true
    } catch (error) {
      if (error.message && error.message.includes("Extension context invalidated")) {
        console.log("Extension context invalidated during API call")
        fallback()
        return false
      }
      throw error
    }
  }

  // Admin page button
  if (adminPageBtn) {
    adminPageBtn.addEventListener("click", () => {
      safeChromeCall(() => {
        chrome.runtime.sendMessage({ action: "openAdminPage" })
      })
    })
  }

  // Bridge page button
  if (bridgePageBtn) {
    bridgePageBtn.addEventListener("click", () => {
      safeChromeCall(() => {
        chrome.runtime.sendMessage({ action: "openBridgePage" })
      })
    })
  }

  // Admin configuration
  const configureAdminBtn = document.getElementById("configureAdmin")
  const adminConfigSection = document.getElementById("adminConfigSection")
  const adminUrlInput = document.getElementById("adminUrl")
  const saveAdminUrlBtn = document.getElementById("saveAdminUrl")
  const adminUrlStatus = document.getElementById("adminUrlStatus")

  // Toggle admin config section
  if (configureAdminBtn) {
    configureAdminBtn.addEventListener("click", () => {
      if (adminConfigSection) {
        adminConfigSection.style.display = adminConfigSection.style.display === "none" ? "block" : "none"
      }
    })
  }

  // Load saved admin URL
  safeChromeCall(() => {
    chrome.storage.sync.get(["adminUrl"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Error loading admin URL:", chrome.runtime.lastError)
        return
      }
      if (result.adminUrl && adminUrlInput) {
        adminUrlInput.value = result.adminUrl
        if (adminUrlStatus) {
          adminUrlStatus.textContent = "✅ Admin website configured"
          adminUrlStatus.style.color = "green"
        }
      }
    })
  })

  // Save admin URL
  if (saveAdminUrlBtn) {
    saveAdminUrlBtn.addEventListener("click", () => {
      const url = adminUrlInput?.value?.trim()
      if (!url) {
        if (adminUrlStatus) {
          adminUrlStatus.textContent = "❌ Please enter a valid URL"
          adminUrlStatus.style.color = "red"
        }
        return
      }

      safeChromeCall(() => {
        chrome.storage.sync.set({ adminUrl: url }, () => {
          if (chrome.runtime.lastError) {
            console.log("Error saving admin URL:", chrome.runtime.lastError)
            if (adminUrlStatus) {
              adminUrlStatus.textContent = "❌ Error saving URL"
              adminUrlStatus.style.color = "red"
            }
          } else {
            if (adminUrlStatus) {
              adminUrlStatus.textContent = "✅ Admin website configured successfully!"
              adminUrlStatus.style.color = "green"
            }
            console.log("Admin website URL saved:", url)
          }
        })
      })
    })
  }

  // Report functionality
  const toggleReportBtn = document.getElementById("toggleReport")
  const reportSection = document.getElementById("reportSection")
  const officeSelect = document.getElementById("officeSelect")
  const emailTemplate = document.getElementById("emailTemplate")
  const sendEmailBtn = document.getElementById("sendEmail")

  if (toggleReportBtn) {
    toggleReportBtn.addEventListener("click", () => {
      if (reportSection) {
        reportSection.style.display = reportSection.style.display === "none" ? "block" : "none"
      }
    })
  }

  if (officeSelect) {
    officeSelect.addEventListener("change", (e) => {
      const selectedOffice = e.target.value
      if (emailTemplate) {
        if (selectedOffice) {
          emailTemplate.style.display = "block"
          const emailBody = document.getElementById("emailBody")
          if (emailBody) {
            emailBody.value = `Dear ${selectedOffice} Team,

Please find attached the incident report generated from the extension.

Best Regards,
Incident Analyzer Extension`
          }
        } else {
          emailTemplate.style.display = "none"
        }
      }
    })
  }

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener("click", () => {
      const office = officeSelect?.value
      if (!office) {
        alert("Please select an office!")
        return
      }
      alert("Email sent successfully (simulation).")
    })
  }

  // Manual analysis button
  if (manualAnalysisBtn) {
    manualAnalysisBtn.addEventListener("click", () => {
      safeChromeCall(() => {
        chrome.runtime.sendMessage({ action: "triggerAnalysis" }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Error triggering analysis:", chrome.runtime.lastError)
          }
        })
        manualAnalysisBtn.textContent = "Analyzing..."
        setTimeout(() => {
          manualAnalysisBtn.textContent = "Analyze Current Page"
        }, 3000)
      })
    })
  }

  // Toggle analysis button
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      analysisEnabled = !analysisEnabled
      toggleBtn.textContent = `Analysis: ${analysisEnabled ? "ON" : "OFF"}`
      toggleBtn.classList.toggle("active", analysisEnabled)

      safeChromeCall(() => {
        chrome.storage.local.set({ analysisEnabled: analysisEnabled })
      })
    })
  }

  // Filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      currentFilter = btn.dataset.severity

      safeChromeCall(() => {
        chrome.storage.local.set({ currentFilter: currentFilter })
      })
      loadIncidents()
    })
  })

  // Load initial states
  safeChromeCall(() => {
    chrome.storage.local.get(["analysisEnabled", "currentFilter"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Error loading states:", chrome.runtime.lastError)
        return
      }

      analysisEnabled = result.analysisEnabled !== false
      if (toggleBtn) {
        toggleBtn.textContent = `Analysis: ${analysisEnabled ? "ON" : "OFF"}`
        toggleBtn.classList.toggle("active", analysisEnabled)
      }

      currentFilter = result.currentFilter || "all"
      filterBtns.forEach((btn) => {
        btn.classList.remove("active")
        if (btn.dataset.severity === currentFilter) {
          btn.classList.add("active")
        }
      })
    })
  })

  // Function to calculate stats from incidents
  function calculateStats(incidents) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = {
      total: incidents.length,
      today: 0,
      critical: 0,
      high: 0,
    }

    incidents.forEach((incident) => {
      const incidentDate = new Date(incident.timestamp)
      incidentDate.setHours(0, 0, 0, 0)

      if (incidentDate.getTime() === today.getTime()) {
        stats.today++
      }

      if (incident.severity === "critical") {
        stats.critical++
      } else if (incident.severity === "high") {
        stats.high++
      }
    })

    return stats
  }

  // Function to filter incidents
  function filterIncidents(incidents) {
    if (currentFilter === "all") {
      return incidents
    }
    return incidents.filter((incident) => incident.severity === currentFilter)
  }

  // Main function to load and display incidents
  function loadIncidents() {
    safeChromeCall(
      () => {
        chrome.storage.local.get(["incidents", "adminComplaints"], (result) => {
          if (chrome.runtime.lastError) {
            console.log("Error loading incidents:", chrome.runtime.lastError)
            return
          }

          const incidents = result.incidents || []
          const complaints = result.adminComplaints || []
          
          // Combine incidents and complaints for display
          const allIncidents = [...incidents, ...complaints.map(c => ({
            type: c.type,
            severity: c.severity,
            location: c.location,
            timestamp: c.timestamp || c.time,
            text: c.description
          }))]
          
          const filteredIncidents = filterIncidents(allIncidents)
          const stats = calculateStats(allIncidents)

          // Update stats display
          if (totalIncidentsEl) totalIncidentsEl.textContent = stats.total
          if (todayIncidentsEl) todayIncidentsEl.textContent = stats.today
          if (criticalIncidentsEl) criticalIncidentsEl.textContent = stats.critical
          if (highIncidentsEl) highIncidentsEl.textContent = stats.high

          // Update incidents list
          if (!incidentsListEl) return

          if (filteredIncidents.length === 0) {
            const message =
              currentFilter === "all"
                ? "No incidents detected yet. Browse social media to start analyzing posts."
                : `No ${currentFilter} severity incidents found.`
            incidentsListEl.innerHTML = `<div class="no-incidents">${message}</div>`
            return
          }

          // Sort incidents by timestamp (newest first)
          const sortedIncidents = filteredIncidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

          incidentsListEl.innerHTML = sortedIncidents
            .slice(0, 10) // Show only first 10
            .map(
              (incident) => `
          <div class="incident-item">
            <div class="incident-type">${incident.type || "Unknown"}
              <span class="severity-badge severity-${incident.severity || "low"}">${(incident.severity || "low").toUpperCase()}</span>
            </div>
            <div class="incident-location">📍 ${incident.location || "Unknown location"}</div>
            <div class="incident-time">🕒 ${new Date(incident.timestamp).toLocaleString()}</div>
            ${incident.text ? `<div class="incident-text" style="margin-top: 5px; font-size: 11px; opacity: 0.9;">${incident.text.substring(0, 100)}${incident.text.length > 100 ? "..." : ""}</div>` : ""}
          </div>
        `,
            )
            .join("")
        })
      },
      () => {
        // Fallback when Chrome APIs are unavailable
        if (incidentsListEl) {
          incidentsListEl.innerHTML =
            '<div class="no-incidents">Extension context invalid - please reload the extension</div>'
        }
      },
    )
  }

  // Listen for storage changes
  if (isExtensionContextValid()) {
    try {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!isExtensionContextValid()) {
          console.log("Extension context invalidated, ignoring storage change")
          return
        }

        if (namespace === "local" && (changes.incidents || changes.adminComplaints)) {
          loadIncidents()
        }
      })
    } catch (error) {
      console.log("Error setting up storage listener:", error)
    }
  }

  // Initial load
  loadIncidents()
})