import { useState } from 'react';
import { Users, Zap, Plus, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import type { LegalAgentRole, LegalAgentCapability } from '../../types/legal';

interface SwarmMember {
  id: string;
  name: string;
  role: string | LegalAgentRole;
  status: 'active' | 'idle' | 'busy';
  performance: number;
  tasksCompleted: number;
  capabilities?: string[] | LegalAgentCapability[];
}

interface Swarm {
  id: string;
  name: string;
  description: string;
  members: SwarmMember[];
  efficiency: number;
  status: 'active' | 'paused';
  type?: 'general' | 'legal';
  caseType?: string;
}

export function SwarmPanel() {
  const [swarms] = useState<Swarm[]>([
    {
      id: '1',
      name: 'Legal Research Team',
      description: 'Swarm dedicated to legal research and analysis tasks',
      type: 'legal',
      caseType: 'workers-compensation',
      members: [
        {
          id: '1',
          name: 'Legal Researcher',
          role: 'Legal Researcher',
          status: 'active',
          performance: 92,
          tasksCompleted: 156,
          capabilities: ['legal-research', 'case-management']
        },
        {
          id: '2',
          name: 'Medical Evidence Analyst',
          role: 'Medical Evidence Analyst',
          status: 'idle',
          performance: 88,
          tasksCompleted: 234,
          capabilities: ['medical-record-analysis', 'document-filing']
        }
      ],
      efficiency: 90,
      status: 'active'
    }
  ]);

  return (
    <Card className="h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Swarms
          </h3>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Swarm
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-4">
            {swarms.map((swarm) => (
              <Card key={swarm.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {swarm.name}
                      <Badge variant={swarm.status === 'active' ? 'default' : 'secondary'}>
                        {swarm.status}
                      </Badge>
                      {swarm.type === 'legal' && (
                        <Badge variant="outline" className="ml-2">
                          {swarm.caseType}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">{swarm.description}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{swarm.members.length}</div>
                      <div className="text-xs text-muted-foreground">Members</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{swarm.efficiency}%</div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {swarm.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                        {member.capabilities && (
                          <div className="flex gap-1 mt-1">
                            {member.capabilities.map((capability, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={
                          member.status === 'active' ? 'default' :
                          member.status === 'idle' ? 'secondary' : 'outline'
                        }>
                          {member.status}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{member.performance}%</div>
                          <div className="text-xs text-muted-foreground">{member.tasksCompleted} tasks</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {swarms.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">No Active Swarms</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a swarm to coordinate multiple AI agents for complex tasks
                </p>
                <Button size="sm">Create Swarm</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}