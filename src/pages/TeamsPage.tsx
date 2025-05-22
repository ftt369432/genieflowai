import React, { useState, useEffect, useRef } from 'react';
import { useTeam } from '../contexts/TeamContext';
import type { Page as PageType, Thread as MessageType, Team as TeamType } from '../types/team';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';

// Placeholder ShadCN/UI components - replace with actual imports if you have them
// const Input = ({ ...props }) => <input {...props} />;
// const Button = ({ ...props }) => <button {...props} />;
// const ScrollArea = ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => <div {...props}>{children}</div>; // Basic placeholder

export function TeamsPage() {
  const {
    teams,
    activeTeam,
    setActiveTeam,
    activePage,
    setActivePage,
    activePageMessages,
    postMessage,
    createPage,
    createTeam,
    loading: loadingTeams,
    loadingMessages,
    refreshTeams
  } = useTeam();

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePageMessages, activePage]);

  useEffect(() => {
    if (!loadingTeams && teams.length > 0) {
      if (!activeTeam) {
        setActiveTeam(teams[0]);
      } else {
        const currentActiveTeamInList = teams.find(t => t.id === activeTeam.id);
        if (currentActiveTeamInList && currentActiveTeamInList !== activeTeam) {
          setActiveTeam(currentActiveTeamInList);
        }
      }
    }
  }, [teams, activeTeam, setActiveTeam, loadingTeams]);

  useEffect(() => {
    if (activeTeam && (!activePage || !activeTeam.pages.find(p => p.id === activePage.id)) && activeTeam.pages.length > 0) {
      setActivePage(activeTeam.pages[0]);
    } else if (activeTeam && activeTeam.pages.length === 0) {
      setActivePage(null);
    }
  }, [activeTeam, activePage, setActivePage]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !activePage) return;
    try {
      await postMessage(activePage.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreatePage = async () => {
    if (activeTeam) {
      const pageName = prompt("Enter new page name (e.g., #general):");
      if (pageName && pageName.trim() !== '') {
        try {
          await createPage(activeTeam.id, { name: pageName, isPrivate: false, description: '' });
        } catch (error) {
          console.error("Failed to create page:", error);
        }
      } else if (pageName !== null) {
        alert("Page name cannot be empty.");
      }
    }
  };

  const handleCreateTeam = async () => {
    const teamName = prompt("Enter new team name:");
    if (teamName && teamName.trim() !== '') {
      try {
        await createTeam({ name: teamName.trim() });
      } catch (error) {
        console.error("Failed to create team:", error);
        alert(`Failed to create team: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (teamName !== null) {
      alert("Team name cannot be empty.");
    }
  };

  if (loadingTeams) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Loading teams...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-20 bg-muted/20 border-r border-border p-2 flex flex-col items-center space-y-2 overflow-y-auto">
        <h2 className="text-sm font-semibold mb-2 sr-only">Teams</h2>
        {teams.map((team: TeamType) => (
          <button
            key={team.id}
            onClick={() => setActiveTeam(team)}
            title={team.name}
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                        ${activeTeam?.id === team.id ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
          >
            {team.name?.substring(0, 2).toUpperCase() || 'T'}
          </button>
        ))}
        <button
            onClick={handleCreateTeam}
            title="Add Team"
            className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold bg-muted hover:bg-muted/80 text-muted-foreground border-2 border-dashed border-muted-foreground/50"
        >
          +
        </button>
      </div>

      <div className="w-64 bg-muted/40 border-r border-border p-4 flex flex-col overflow-y-auto">
        {activeTeam ? (
          <>
            <h2 className="text-xl font-semibold mb-1">{activeTeam.name}</h2>
            <p className="text-xs text-muted-foreground mb-4 truncate" title={activeTeam.description}>{activeTeam.description || 'No description'}</p>
            
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-muted-foreground">Channels</h3>
              <Button onClick={handleCreatePage} className="text-xs px-2 py-1" variant="ghost" size="sm">+</Button>
            </div>
            <ScrollArea className="flex-1 -mx-4">
              <div className="px-4 space-y-1">
              {activeTeam.pages?.length > 0 ? activeTeam.pages.map((page: PageType) => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm 
                              ${activePage?.id === page.id ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'}`}
                >
                  # {page.name}
                </button>
              )) : <p className="text-sm text-muted-foreground px-3 py-2">No pages in this team.</p>}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a team</p>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-card" style={{ maxHeight: '100vh' }}>
        {activePage ? (
          <>
            <div className="border-b border-border p-4 flex-shrink-0">
              <h1 className="text-xl font-semibold"># {activePage.name}</h1>
              {activePage.description && <p className="text-sm text-muted-foreground">{activePage.description}</p>}
            </div>

            <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto" id="message-list">
              {loadingMessages ? (
                <p className="text-muted-foreground text-center">Loading messages...</p>
              ) : activePageMessages.length > 0 ? (
                activePageMessages.map((msg: MessageType, index: number) => (
                  <div key={msg.id || index} className="flex flex-col items-start group mb-3">
                    <div className="flex items-center mb-1">
                      <span className="font-semibold mr-2 text-sm">{msg.user_profile?.display_name || msg.user_profile?.full_name || 'User'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <div className="ml-0">
                       <p className="bg-muted/50 p-3 rounded-lg max-w-xl break-words text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No messages in this channel yet. <br />
                  Be the first to say something!
                </p>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="border-t border-border p-4 flex-shrink-0 bg-background">
              <div className="flex items-center bg-muted/30 rounded-lg">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                  placeholder={`Message #${activePage.name}`}
                  className="flex-1 p-3 border-none rounded-l-lg bg-transparent focus:ring-0 focus:outline-none text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || loadingMessages}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 text-sm font-medium"
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-lg">
              {activeTeam ? 'Select a page/channel to start chatting.' : 'Select a team and page/channel.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
