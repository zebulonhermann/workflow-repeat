import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Scale, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Users,
  BarChart3,
  Zap
} from "lucide-react"
import { ContractChatbotWrapper } from "@/components/newfront/contract-chatbot-wrapper"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock data for demo
const mockContracts = [
  {
    id: "contract:001",
    type: "NDA",
    parties: "Acme Corp / TechStart Inc",
    status: "draft",
    assignee: "requester",
    stage: "Drafting",
    createdAt: "2025-01-15",
  },
  {
    id: "contract:002",
    type: "MSA",
    parties: "Newfront / VendorCo",
    status: "review",
    assignee: "contract_manager",
    stage: "Manager Review",
    createdAt: "2025-01-14",
  },
  {
    id: "contract:003",
    type: "SOW",
    parties: "ClientCo / Newfront",
    status: "approval",
    assignee: "legal",
    stage: "Legal Approval",
    createdAt: "2025-01-13",
  },
  {
    id: "contract:004",
    type: "NDA",
    parties: "PartnerInc / Newfront",
    status: "approved",
    assignee: "legal",
    stage: "Archived",
    createdAt: "2025-01-12",
  },
]

const kpiData = {
  timeToFirstDraft: "2.3 min",
  reviewTimeReduction: "45%",
  autoResolvedRedlines: "78%",
  costPerContract: "$0.016",
  avgLatencyPerStep: "1.8s",
  clauseCoverage: "94%",
  policyViolationsCaught: 12,
  falsePositives: 2,
}

export default function ContractsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Newfront Contracts</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contracts
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Templates
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Analytics
              </a>
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                New Contract
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Contract Management</h1>
          <p className="text-muted-foreground">
            AI-powered contract drafting, clause validation, and workflow orchestration
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Time to First Draft</div>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.timeToFirstDraft}</div>
            <div className="text-xs text-muted-foreground mt-1">↓ 35% vs last month</div>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Review Time Reduction</div>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.reviewTimeReduction}</div>
            <div className="text-xs text-muted-foreground mt-1">↑ 12% vs last month</div>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Auto-Resolved Redlines</div>
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.autoResolvedRedlines}</div>
            <div className="text-xs text-muted-foreground mt-1">↑ 8% vs last month</div>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Cost per Contract</div>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.costPerContract}</div>
            <div className="text-xs text-muted-foreground mt-1">↓ 22% vs last month</div>
          </Card>
        </div>

        {/* Secondary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Avg Latency per Step</div>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.avgLatencyPerStep}</div>
            <div className="text-xs text-muted-foreground mt-1">↓ 15% vs last month</div>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Clause Coverage</div>
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.clauseCoverage}</div>
            <div className="text-xs text-muted-foreground mt-1">↑ 3% vs last month</div>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Policy Violations Caught</div>
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.policyViolationsCaught}</div>
            <div className="text-xs text-muted-foreground mt-1">This month</div>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">False Positives</div>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpiData.falsePositives}</div>
            <div className="text-xs text-muted-foreground mt-1">↓ 60% vs last month</div>
          </Card>
        </div>

        {/* Contracts Table */}
        <Card className="p-6 border-blue-500/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Active Contracts</h2>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <FileText className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono text-sm">{contract.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{contract.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{contract.parties}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.status === "approved"
                          ? "default"
                          : contract.status === "approval"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{contract.stage}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {contract.assignee.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contract.createdAt}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Features Section */}
        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          <Card className="p-6 border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Persona-Scoped Access</h3>
            <p className="text-muted-foreground">
              Role-based permissions ensure requesters can draft, managers can negotiate, and legal can approve.
            </p>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Guardrailed Generation</h3>
            <p className="text-muted-foreground">
              Templates and clause libraries with required/optional clauses by jurisdiction and product.
            </p>
          </Card>

          <Card className="p-6 border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Model Routing</h3>
            <p className="text-muted-foreground">
              Cheap models for extraction, premium models for legal reasoning. Cost and latency tracked per step.
            </p>
          </Card>
        </div>
      </div>

      <ContractChatbotWrapper />
    </div>
  )
}
