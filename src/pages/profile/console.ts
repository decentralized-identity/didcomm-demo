import * as m from "mithril"
import logger, { LogTopic, Record } from "../../lib/logger"

import "./console.css"

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
  subscription: any

  appendLog(record: Record) {
    this.logs.push(record.message)
    m.redraw() // Trigger a redraw to update the logs
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

  parseLogEntry(entry: string) : m.Vnode {
    const colorizeDid = (entry: string): m.Vnode => {
      const didRegex = /(.*)(did):([a-z0-9]+):((?:[a-zA-Z0-9._%-]*:)*[a-zA-Z0-9._%-]+)([?/#][a-zA-Z0-9._%-])?(".*)/
      if(!didRegex.test(entry))
        return m("span", entry);
      const match = didRegex.exec(entry);
      return m(
        "span",
        match[1],
        m("span", {style:{color:"#d41f0b"}}, match[2]),
        ":",
        m("span", {style:{color:"#1a4b99"}}, match[3]),
        ":",
        m("span", {style:{color:"#32a852"}}, match[4]),
        m("span", {style:{color:"#bf800b"}}, match[5]),
        match[6]
      );
    }
    const colorizeType = (header_string: string, entry: string): m.Vnode => {
      const decodedMessage = JSON.parse(entry.slice(header_string.length));
      const renderedMessage = JSON.stringify(decodedMessage, null, 2);
      const lines = renderedMessage.split("\n");

      let messages : (m.Vnode | string)[] = [];
      for(var i = 0; i < lines.length; i++) {
        if(i > 0)
          messages.push("\n");

        let line = lines[i];

        if((/^  "type": "(.+)",?$/).test(line)) {
          const regex = /(.+)"(.+)\/([a-z0-9-_\.]+)\/([0-9]+\.[0-9])\/([a-z0-9-_\.]+)/i;
          if(!regex.test(line)) {
            messages.push(m("span", line));
            continue;
          }

          let match = regex.exec(line);
          messages.push(
            match[1],
            '"',
            m("span", {style:{color:"#0070c0"}}, match[2]),
            "/",
            /*original slide color: "#f1c232"*/
            m("span", {style:{color:"#b97713"}}, match[3]),
            "/",
            m("span", {style:{color:"#c00000"}}, match[4]),
            "/",
            m("span", {style:{color:"#51a33f"}}, match[5])
          );
          continue;
        }
        messages.push(colorizeDid(line));
      }
      return m("span", header_string, messages);
    };

    if(entry.startsWith("Received: ")) {
      return colorizeType("Received: ", entry);
    }
    if(entry.startsWith("Sent: ")) {
      return colorizeType("Sent: ", entry);
    }
    return m("span", entry);
  }

  view() {
    return m(".console", [
      m(ConsoleControls, {
        copyLogs: this.copyLogs.bind(this),
        clearLogs: this.clearLogs.bind(this),
        scrollToBottom: this.scrollToBottom.bind(this),
        setGroup: (group: LogGroups) => (this.currentGroup = group),
      }),
      m(
        "pre.logs-viewport",
        {
          oncreate: vnode => (this.logsViewport = vnode.dom as HTMLElement),
          onscroll: (e: Event) => this.handleScroll(e),
        },
        this.logs.map(log => m("code", this.parseLogEntry(log)))
      ),
    ])
  }

  oncreate() {
    this.subscription = logger.subscribe(LogTopic.LOG, async (record: any) => {
      this.appendLog(record)
    })
  }

  onremove() {
    this.subscription?.close()
  }

  onupdate(vnode: m.VnodeDOM<ConsoleAttributes>) {
    if (this.autoScroll) {
      const container = vnode.dom.querySelector(".logs-viewport") as HTMLElement
      container.scrollTop = container.scrollHeight
    }
  }
}

export default ConsoleComponent
