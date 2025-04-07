import React, { useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '../components/ui/ResizablePanel';
import { PageContainer } from '../components/ui/ResponsiveContainer';
import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth/authService';
import { GenieDriveHeader } from '../components/geniedrive/GenieDriveHeader';
import { GenieDriveSidebar } from '../components/geniedrive/GenieDriveSidebar';
import { GenieDriveFileList } from '../components/geniedrive/GenieDriveFileList';
import { GenieDrivePreview } from '../components/geniedrive/GenieDrivePreview';
import { GenieDriveAIPanel } from '../components/geniedrive/GenieDriveAIPanel';
import { GenieDriveAIPopup } from '../components/geniedrive/GenieDriveAIPopup';
import { GenieDriveUploadModal } from '../components/geniedrive/GenieDriveUploadModal';
import { GenieDriveViewState, GenieDriveItem } from '../types/geniedrive';
import { genieDriveService } from '../services/geniedrive/genieDriveService';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Maximize2, Minimize2, FileText, Upload, Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

export function GenieDrivePage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<GenieDriveItem[]>([]);
  const [currentItem, setCurrentItem] = useState<GenieDriveItem | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // View state keeps track of current folder, sorting, filtering, etc.
  const [viewState, setViewState] = useState<GenieDriveViewState>({
    currentFolderId: null, // null is root
    path: [],
    sortOptions: {
      field: 'name',
      direction: 'asc'
    },
    filter: {},
    viewMode: 'grid',
    selectedItems: []
  });

  // Check auth
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Initialize and load data
  useEffect(() => {
    async function initializeGenieDrive() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize the service
        await genieDriveService.initialize();
        
        // Load initial items
        await loadItems(viewState.currentFolderId);
      } catch (err) {
        console.error('Failed to initialize GenieDrive:', err);
        setError('Failed to load GenieDrive. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeGenieDrive();
  }, []);

  // Load items based on current folder and filters
  const loadItems = async (folderId: string | null) => {
    try {
      setIsLoading(true);
      
      const items = await genieDriveService.getItems(folderId, viewState.filter);
      setItems(items);
      
      // Update path
      if (folderId) {
        // Get the folder item to know its path
        const folder = items.find(item => item.id === folderId);
        if (folder) {
          setViewState(prev => ({
            ...prev,
            path: folder.path
          }));
        }
      } else {
        setViewState(prev => ({
          ...prev,
          path: []
        }));
      }
      
      // Reset current item when changing folders
      setCurrentItem(null);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to a folder
  const navigateToFolder = (folderId: string | null) => {
    setViewState(prev => ({
      ...prev,
      currentFolderId: folderId,
      selectedItems: []
    }));
    loadItems(folderId);
  };

  // Handle item selection
  const handleItemSelect = (item: GenieDriveItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      setCurrentItem(item);
    }
  };

  // Handle item click for preview
  const handleItemClick = (item: GenieDriveItem) => {
    if (item.type !== 'folder') {
      setCurrentItem(item);
    }
  };

  // Toggle expanded view for preview
  const togglePreviewExpanded = () => {
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  // Check if user has GenieDrive access
  const hasGenieDriveAccess = () => {
    // Temporarily return true for testing
    return true;
    // Will restore this later:
    // return hasProAccess();
  };

  // Content placeholder when no file is selected
  const renderNoFileSelected = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <FileText className="w-20 h-20 mb-4 opacity-20" />
      <h2 className="text-xl font-medium mb-2">No file selected</h2>
      <p className="text-center max-w-md text-sm">
        Select a file from the list to preview its content and access AI analysis.
      </p>
    </div>
  );

  // Render access restriction message
  const renderAccessRestriction = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 rounded-lg">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Upgrade Required</h2>
        <p className="mb-6">
          GenieDrive is available exclusively for Pro and Enterprise subscribers.
          Upgrade your plan to access advanced file management with AI analysis.
        </p>
        <Button onClick={() => navigate('/subscription')}>
          View Plans
        </Button>
      </div>
    </div>
  );

  // Create a new folder
  const handleCreateFolder = async (folderName: string) => {
    try {
      setIsLoading(true);
      await genieDriveService.createFolder(folderName, viewState.currentFolderId);
      await loadItems(viewState.currentFolderId);
      setShowCreateFolderModal(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
      setError('Failed to create folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Main render
  if (!hasGenieDriveAccess()) {
    return (
      <div className="h-full">
        {renderAccessRestriction()}
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* GenieDrive Header */}
        <GenieDriveHeader 
          viewState={viewState}
          onViewStateChange={setViewState}
          onUploadClick={() => setShowUploadModal(true)}
          onCreateFolderClick={() => setShowCreateFolderModal(true)}
        />
        
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <GenieDriveSidebar 
            selectedFolder={viewState.currentFolderId}
            onFolderSelect={navigateToFolder}
          />
          
          {/* Main Content with Resizable Panels */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              {/* File List Panel */}
              <ResizablePanel defaultSize={currentItem ? 70 : 100} minSize={40}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner className="h-8 w-8" />
                    <span className="ml-2">Loading files...</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full text-red-500 p-4">
                    <p>{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => loadItems(viewState.currentFolderId)}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <GenieDriveFileList 
                    items={items}
                    viewState={viewState}
                    onViewStateChange={setViewState}
                    onItemSelect={handleItemSelect}
                    onItemClick={handleItemClick}
                    selectedItem={currentItem}
                  />
                )}
              </ResizablePanel>
              
              {/* Right Side Panel with Tabs - Only show when document is selected */}
              {currentItem && currentItem.type !== 'folder' && (
                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="flex flex-col h-full border-l">
                    {/* Tabbed Interface */}
                    <Tabs defaultValue="preview" className="flex flex-col h-full">
                      <div className="flex items-center justify-between border-b px-3 py-2">
                        <TabsList className="bg-transparent p-0">
                          <TabsTrigger value="preview" className="px-3 py-1.5 text-sm">
                            Preview
                          </TabsTrigger>
                          <TabsTrigger value="ai" className="px-3 py-1.5 text-sm">
                            AI Analysis
                          </TabsTrigger>
                        </TabsList>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => setCurrentItem(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Preview Tab */}
                      <TabsContent value="preview" className="flex-1 overflow-auto m-0">
                        <GenieDrivePreview item={currentItem} />
                      </TabsContent>
                      
                      {/* AI Analysis Tab */}
                      <TabsContent value="ai" className="flex-1 overflow-auto m-0">
                        <GenieDriveAIPanel item={currentItem} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
        
        {/* Upload Modal */}
        <GenieDriveUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          currentFolder={viewState.currentFolderId}
          onSuccess={() => loadItems(viewState.currentFolderId)}
        />
      </div>
    </div>
  );
} 