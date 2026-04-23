import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const BASE_OPTIONS = [
  { id: "how-system-works", label: "How does the system work?" },
  { id: "how-booking-works", label: "How do bookings work?" },
  { id: "how-tickets-work", label: "How do tickets work?" },
  { id: "notifications-help", label: "What do notifications do?" }
];

const ROLE_OPTIONS = [
  { id: "admin-help", label: "What can admins do?", type: "admin" },
  { id: "technician-help", label: "What can technicians do?", type: "technician" },
  { id: "signin-help", label: "Why should I sign in?", type: "guest" }
];

const INITIAL_BOT_MESSAGE = {
  id: "welcome",
  role: "bot",
  text:
    "I can explain how the system works. Ask about bookings, tickets, notifications, roles, or sign-in, or tap one of the quick questions below.",
  links: []
};

export default function SupportAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_BOT_MESSAGE]);

  const options = useMemo(() => {
    const items = [...BASE_OPTIONS];

    if (user?.roles?.includes("ADMIN")) {
      items.push(ROLE_OPTIONS[0]);
    } else if (user?.roles?.includes("TECHNICIAN")) {
      items.push(ROLE_OPTIONS[1]);
    } else if (!user) {
      items.push(ROLE_OPTIONS[2]);
    }

    return items;
  }, [user]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const thread = document.querySelector(".support-assistant-messages");
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages, open]);

  function handleQuickQuestion(optionId) {
    const option = options.find((item) => item.id === optionId);
    if (!option) {
      return;
    }

    const reply = getAssistantReply(option.label, user);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: option.label },
      { id: `bot-${Date.now()}-${option.id}`, role: "bot", text: reply.text, links: reply.links }
    ]);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question) {
      return;
    }

    const reply = getAssistantReply(question, user);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: question },
      { id: `bot-${Date.now()}-text`, role: "bot", text: reply.text, links: reply.links }
    ]);
    setInput("");
  }

  function resetConversation() {
    setMessages([INITIAL_BOT_MESSAGE]);
    setInput("");
  }

  return (
    <>
      {open ? <button type="button" className="assistant-backdrop" onClick={() => setOpen(false)} aria-label="Close assistant" /> : null}

      <div className={`support-assistant ${open ? "open" : ""}`}>
        <button
          type="button"
          className="support-assistant-toggle"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label="Open system assistant"
        >
          <AssistantIcon />
        </button>

        {open ? (
          <section className="support-assistant-panel">
            <div className="support-assistant-header">
              <div>
                <p className="eyebrow">System Guide</p>
                <h3>Ask how anything works.</h3>
              </div>
              <button type="button" className="support-assistant-close" onClick={() => setOpen(false)} aria-label="Close assistant">
                <CloseIcon />
              </button>
            </div>

            <div className="support-assistant-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`assistant-bubble ${message.role === "user" ? "assistant-bubble-user" : "assistant-bubble-bot"}`}
                >
                  {message.role === "bot" ? <strong>Campus Operations Assistant</strong> : <strong>You</strong>}
                  <p>{message.text}</p>
                  {message.links?.length ? (
                    <div className="assistant-link-list">
                      {message.links.filter((link) => canShowLink(link, user)).map((link) => (
                        <Link
                          key={`${message.id}-${link.to}`}
                          to={link.to}
                          className={`assistant-link ${location.pathname === link.to ? "current" : ""}`}
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="assistant-option-list">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="assistant-option"
                  onClick={() => handleQuickQuestion(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <form className="assistant-input-row" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about bookings, tickets, replies, roles..."
              />
              <button type="submit">Send</button>
              <button type="button" className="secondary-button" onClick={resetConversation}>
                Reset
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </>
  );
}

function getAssistantReply(question, user) {
  const normalized = question.trim().toLowerCase();

  if (includesAny(normalized, ["how long", "reply", "first response", "respond to ticket", "ticket reply"])) {
    return {
      text:
        "Right now this system does not enforce a fixed response-time SLA for tickets. A ticket stays open until an admin or technician comments, assigns it, or changes its status. If you later add service timers, you could measure time-to-first-response and time-to-resolution from the ticket creation time.",
      links: visibleTicketLinks(user)
    };
  }

  if (includesAny(normalized, ["booking", "reserve", "lecture hall", "lab"])) {
    return {
      text:
        "Bookings start from the facilities catalogue. Choose an active resource, enter purpose, attendees, and a valid time slot. The system checks capacity, availability windows, and overlapping reservations before saving the request. Admins then approve or reject it.",
      links: [
        { label: "Browse facilities", to: "/resources" },
        { label: "My bookings", to: "/bookings", requiresAuth: true }
      ]
    };
  }

  if (includesAny(normalized, ["ticket", "incident", "issue", "maintenance"])) {
    return {
      text:
        "Incident tickets let users report problems against campus resources. You can set category, priority, location, description, and contact details, then add comments or images. Staff move tickets through OPEN, IN_PROGRESS, RESOLVED, CLOSED, or REJECTED.",
      links: visibleTicketLinks(user)
    };
  }

  if (includesAny(normalized, ["notification", "alert", "inbox"])) {
    return {
      text:
        "Notifications are generated for booking approvals or rejections, ticket status changes, and ticket comments. You can filter them by category, open the related booking or ticket, and turn categories on or off from the settings icon on the notifications page.",
      links: [{ label: "Open notifications", to: "/notifications", requiresAuth: true }]
    };
  }

  if (includesAny(normalized, ["admin", "role", "user management", "technician"])) {
    if (user?.roles?.includes("ADMIN")) {
      return {
        text:
          "Admins can review booking requests, manage user roles and account status, maintain the resource catalogue, and work with operational tickets. The role management page also supports filtering by name, email, role, and active status.",
        links: [
          { label: "Dashboard", to: "/dashboard", requiresAdmin: true },
          { label: "Role management", to: "/admin/roles", requiresAdmin: true }
        ]
      };
    }

    if (user?.roles?.includes("TECHNICIAN")) {
      return {
        text:
          "Technicians work from the ticket operations page. They can review assigned incidents, add comments, and move tickets through the operational workflow when an issue is being handled.",
        links: [{ label: "Ticket operations", to: "/tickets/manage", requiresOperations: true }]
      };
    }

    return {
      text:
        "This system uses role-based access. Standard users can request bookings and create tickets. Technicians handle operational tickets. Admins can also manage users, resources, and approvals.",
      links: [{ label: "Sign in", to: "/signin" }]
    };
  }

  if (includesAny(normalized, ["sign in", "login", "google", "oauth"])) {
    return {
      text:
        "Sign-in uses Google OAuth. After logging in, the app checks your session and routes you to the right area based on your roles. If an account is deactivated, access is blocked even if the Google sign-in itself succeeds.",
      links: [{ label: "Sign in", to: "/signin" }]
    };
  }

  if (includesAny(normalized, ["system", "how it works", "whole system", "platform"])) {
    return {
      text:
        "Smart Campus Operations Hub brings together facility browsing, booking approvals, incident reporting, ticket operations, notifications, and role-based security. The frontend is React, the backend is Spring Boot, and data is stored in MongoDB.",
      links: [
        { label: "Browse facilities", to: "/resources" },
        { label: "Notifications", to: "/notifications", requiresAuth: true }
      ]
    };
  }

  return {
    text:
      "I can help with bookings, tickets, notifications, sign-in, roles, and how the overall system works. Try asking something like 'How do bookings work?' or 'How long does it take to reply to a ticket?'",
    links: []
  };
}

function visibleTicketLinks(user) {
  return [
    { label: "My tickets", to: "/tickets", requiresAuth: true },
    { label: "Ticket operations", to: "/tickets/manage", requiresOperations: true }
  ].filter((link) => canShowLink(link, user));
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function canShowLink(link, user) {
  if (link.requiresAdmin) {
    return user?.roles?.includes("ADMIN");
  }

  if (link.requiresOperations) {
    return user?.roles?.some((role) => role === "ADMIN" || role === "TECHNICIAN");
  }

  if (link.requiresAuth) {
    return Boolean(user);
  }

  return true;
}

function AssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="7" width="14" height="10" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h.01M15 12h.01M12 4v2M8 20l2.2-2M16 20l-2.2-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
