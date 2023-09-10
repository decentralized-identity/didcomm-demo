import * as m from "mithril"

interface ConsoleAttributes {
  stream: any // Placeholder for now
}

enum LogGroups {
  Everything = "everything",
  JustMessages = "just messages",
  CurrentConnection = "current connection",
}

interface ControlAttributes {
  copyLogs: Function
  clearLogs: Function
  scrollToBottom: Function
  setGroup: Function
}

class ConsoleControls implements m.ClassComponent<ControlAttributes> {
  view(vnode: m.Vnode<ControlAttributes>) {
    return m(".level", [
      m(".level-left", [
        m(".level-item", [
          m("div.select", [
            m(
              "select",
              {
                onchange: (e: Event) =>
                  vnode.attrs.setGroup(
                    (e.target as HTMLSelectElement).value as LogGroups
                  ),
              },
              [
                Object.values(LogGroups).map(group =>
                  m("option", { value: group }, group)
                ),
              ]
            ),
          ]),
        ]),
      ]),
      m(".level-right", [
        m(".level-item", [
          m("button.button.is-light", { onclick: vnode.attrs.copyLogs }, [
            m("span.icon", [m("i.fas.fa-copy")]),
          ]),
        ]),
        m(".level-item", [
          m("button.button.is-light", { onclick: vnode.attrs.clearLogs }, [
            m("span.icon", [m("i.fas.fa-trash")]),
          ]),
        ]),
        m(".level-item", [
          m("button.button.is-light", { onclick: vnode.attrs.scrollToBottom }, [
            m("span.icon", [m("i.fas.fa-angle-double-down")]),
          ]),
        ]),
      ]),
    ])
  }
}

class ConsoleComponent implements m.ClassComponent<ConsoleAttributes> {
  logs: any[] = []
  currentGroup: LogGroups = LogGroups.Everything
  autoScroll: boolean = true
  logsViewport: HTMLElement | null = null

  appendLog(entry: any) {
    this.logs.push(JSON.stringify(entry, null, 2))
  }

  filterLogs() {
    // Filtering logic based on currentGroup goes here
  }

  clearLogs() {
    this.logs = []
  }

  copyLogs() {
    navigator.clipboard
      .writeText(this.logs.join("\n"))
      .then(() => {
        console.log("Logs copied to clipboard")
      })
      .catch(err => {
        console.error("Could not copy logs: ", err)
      })
  }

  scrollToBottom() {
    if (this.logsViewport) {
      this.logsViewport.scrollTop = this.logsViewport.scrollHeight
    }
  }

  handleScroll(event: Event) {
    const container = event.target as HTMLElement

    // Check if we're close to the bottom
    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 5
    this.autoScroll = isAtBottom
  }

  view() {
    return m(".console-container", { style: "height: 100%;" }, [
      m(ConsoleControls, {
        copyLogs: this.copyLogs.bind(this),
        clearLogs: this.clearLogs.bind(this),
        scrollToBottom: this.scrollToBottom.bind(this),
        setGroup: (group: LogGroups) => (this.currentGroup = group),
      }),
      m(
        ".logs-viewport",
        {
          oncreate: vnode => (this.logsViewport = vnode.dom as HTMLElement),
          style: "height: 90%; overflow-y: auto;",
          onscroll: (e: Event) => this.handleScroll(e),
        },
        this.logs.map(log => m("div", log))
      ),
    ])
  }

  oncreate(vnode: m.VnodeDOM<ConsoleAttributes>) {
    // Logic to read from the stream and append to logs
    // Placeholder: For demo purposes, adding a log every 2 seconds
    setInterval(() => {
      this.appendLog({
        message: `Log at ${new Date().toISOString()}`,
        group: LogGroups.Everything,
      })
      m.redraw() // Trigger a redraw to update the logs
    }, 2000)
  }

  onupdate(vnode: m.VnodeDOM<ConsoleAttributes>) {
    if (this.autoScroll) {
      const container = vnode.dom.querySelector(".logs-viewport") as HTMLElement
      container.scrollTop = container.scrollHeight
    }
  }
}

export default ConsoleComponent
