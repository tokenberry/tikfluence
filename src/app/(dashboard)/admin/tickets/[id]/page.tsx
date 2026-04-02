"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TicketStatusBadge } from "@/components/ui/Badge"

interface TicketMessage {
  id: string
  senderId: string
  message: string
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: number
  createdAt: string
  creator: { id: string; name: string; email: string }
  assignee: { id: string; name: string } | null
  messages: TicketMessage[]
}

const priorityLabels: Record<number, { label: string; color: string }> = {
  0: { label: "Low", color: "text-gray-500" },
  1: { label: "Medium", color: "text-yellow-600" },
  2: { label: "High", color: "text-orange-600" },
  3: { label: "Critical", color: "text-red-600" },
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchTicket = () => {
    fetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) setTicket(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const handleStatusChange = async (status: string) => {
    setUpdating(true)
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchTicket()
    } catch {
      // ignore
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (priority: number) => {
    setUpdating(true)
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      })
      fetchTicket()
    } catch {
      // ignore
    } finally {
      setUpdating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      })
      setNewMessage("")
      fetchTicket()
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-32 rounded bg-gray-200" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Not Found</h1>
      </div>
    )
  }

  const priority = priorityLabels[ticket.priority] ?? priorityLabels[0]

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <a href="/admin/tickets" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to Tickets
      </a>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Opened by {ticket.creator.name} ({ticket.creator.email}) on{" "}
            {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      {/* Description */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-gray-600">{ticket.description}</p>
      </div>

      {/* Admin Controls */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(Number(e.target.value))}
            disabled={updating}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
          >
            <option value={0}>Low</option>
            <option value={1}>Medium</option>
            <option value={2}>High</option>
            <option value={3}>Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Priority Level</label>
          <span className={`text-sm font-medium ${priority.color}`}>{priority.label}</span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Messages ({ticket.messages.length})
          </h2>
        </div>

        {ticket.messages.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">No messages yet.</div>
        ) : (
          <div className="divide-y divide-gray-100 p-4 space-y-0">
            {ticket.messages.map((msg) => {
              const isCreator = msg.senderId === ticket.creator.id
              return (
                <div key={msg.id} className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium ${
                        isCreator ? "text-blue-600" : "text-green-600"
                      }`}
                    >
                      {isCreator ? ticket.creator.name : "Admin"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Reply form */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              maxLength={5000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Reply"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
