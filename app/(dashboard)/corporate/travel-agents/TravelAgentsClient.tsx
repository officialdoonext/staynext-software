'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Users,
  Percent,
  Phone,
  Mail,
  Award,
  Search,
  Download,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  TravelAgentRecord,
  createTravelAgent,
  deleteTravelAgent,
} from '@/services/corporate.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TravelAgentsClientProps {
  initialAgents: TravelAgentRecord[]
  propertyId: string
}

export function TravelAgentsClient({ initialAgents, propertyId }: TravelAgentsClientProps) {
  const router = useRouter()
  const [agents, setAgents] = useState<TravelAgentRecord[]>(initialAgents)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    agencyName: '',
    iataNumber: '',
    email: '',
    phone: '',
    commissionPercentage: '10',
  })

  const filtered = agents.filter((a) => {
    const q = searchTerm.toLowerCase()
    return (
      !searchTerm ||
      a.name.toLowerCase().includes(q) ||
      (a.agencyName && a.agencyName.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.iataNumber && a.iataNumber.toLowerCase().includes(q))
    )
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter an agent name')
      return
    }

    setIsSubmitting(true)
    const res = await createTravelAgent({
      propertyId,
      name: form.name.trim(),
      agencyName: form.agencyName.trim() || undefined,
      iataNumber: form.iataNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      commissionPercentage: parseFloat(form.commissionPercentage) || 10,
    })
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Travel agent registered successfully')
      setIsAddOpen(false)
      setForm({
        name: '',
        agencyName: '',
        iataNumber: '',
        email: '',
        phone: '',
        commissionPercentage: '10',
      })
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to register agent')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsSubmitting(true)
    const res = await deleteTravelAgent(deleteId)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('Agent removed')
      setAgents((prev) => prev.filter((a) => a.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete agent')
    }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info('No agents to export')
      return
    }
    const headers = ['Agent Name', 'Agency Name', 'IATA Number', 'Commission %', 'Email', 'Phone']
    const rows = filtered.map((a) => [
      `"${a.name}"`,
      `"${a.agencyName || '-'}"`,
      `"${a.iataNumber || '-'}"`,
      `${a.commissionPercentage}%`,
      `"${a.email || '-'}"`,
      `"${a.phone || '-'}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `travel_agents_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/corporate">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900 font-sora">
              Travel Agents &amp; Booking Intermediaries
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              IATA certified agents, DMC partners, tour operators, and commission settlement rates.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Travel Agent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 cursor-pointer rounded-md font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agent, agency, IATA #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-2xs">
          <div className="w-12 h-12 bg-[#f7f2fd] text-[#5e2b9d] rounded-md flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-medium text-gray-900 font-sora">No Travel Agents Registered</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Register independent travel advisors, tour operators, and destination management companies (DMCs).
          </p>
          <div className="mt-6">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-[#5e2b9d] hover:bg-[#4d2282] text-white font-medium cursor-pointer rounded-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Register First Agent
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="bg-white border border-gray-200 rounded-md p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] text-gray-600 bg-gray-50 rounded-sm">
                    {agent.iataNumber ? `IATA #${agent.iataNumber}` : 'Direct Partner'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(agent.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-rose-600 cursor-pointer rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <h3 className="text-base font-medium text-gray-900 mt-2 font-sora">{agent.name}</h3>
                {agent.agencyName && (
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">{agent.agencyName}</p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                  {agent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                  {agent.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{agent.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Commission Rate:</span>
                <span className="font-mono font-medium text-[#5e2b9d] text-sm">
                  {agent.commissionPercentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD AGENT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Register Travel Agent</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Set up agency affiliation, accreditation numbers, and standard commission rate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agent Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Travel Agency Name</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Sky Holidays"
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">IATA / TIDS Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1432098"
                  value={form.iataNumber}
                  onChange={(e) => setForm({ ...form, iataNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="agent@agency.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 99887 76655"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Agreed Commission Percentage (%) *
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                placeholder="10"
                value={form.commissionPercentage}
                onChange={(e) => setForm({ ...form, commissionPercentage: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5e2b9d]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="text-xs cursor-pointer rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="text-xs bg-[#5e2b9d] hover:bg-[#4d2282] text-white cursor-pointer rounded-md font-medium"
              >
                {isSubmitting ? 'Registering...' : 'Register Agent'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium font-sora">Delete Travel Agent</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to delete this travel agent profile?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              className="text-xs cursor-pointer rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md font-medium"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
