import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, Star, Share, Clock, Trash, Cloud, Folder, Image, 
  FileText, File, FileCode, FileAudio, FileVideo, Film
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GenieDriveStorage } from '../../types/geniedrive';
import { genieDriveService } from '../../services/geniedrive/genieDriveService';

interface GenieDriveSidebarProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function GenieDriveSidebar({ selectedFolder, onFolderSelect }: GenieDriveSidebarProps) {
  const [storage, setStorage] = useState<GenieDriveStorage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadStorage() {
      try {
        setIsLoading(true);
        const storageInfo = await genieDriveService.getStorage();
        setStorage(storageInfo);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStorage();
  }, []);

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate used percentage
  const calculateUsedPercentage = (): number => {
    if (!storage) return 0;
    return Math.floor((storage.usedSpace / storage.totalSpace) * 100);
  };

  // Navigation item component
  const NavItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false,
    count
  }: { 
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    count?: number;
  }) => (
    <button 
      className={cn(
        "flex items-center w-full px-2 py-2 rounded-md text-left text-sm",
        isActive 
          ? "bg-blue-50 text-blue-700" 
          : "text-gray-700 hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="flex-grow">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">{count}</span>
      )}
    </button>
  );

  return (
    <div className="w-52 bg-white border-r p-3 overflow-y-auto">
      <div className="space-y-6">
        {/* Main locations */}
        <div className="space-y-1">
          <NavItem
            icon={FolderOpen}
            label="My Drive"
            onClick={() => onFolderSelect(null)}
            isActive={selectedFolder === null}
          />
          <NavItem
            icon={Star}
            label="Starred"
            onClick={() => {}}
          />
          <NavItem
            icon={Share}
            label="Shared with me"
            onClick={() => {}}
          />
          <NavItem
            icon={Clock}
            label="Recent"
            onClick={() => {}}
          />
          <NavItem
            icon={Trash}
            label="Trash"
            onClick={() => {}}
          />
        </div>
        
        {/* Categories */}
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Categories
          </div>
          <div className="space-y-1">
            <NavItem
              icon={FileText}
              label="Documents"
              onClick={() => {}}
            />
            <NavItem
              icon={Image}
              label="Images"
              onClick={() => {}}
            />
            <NavItem
              icon={FileVideo}
              label="Videos"
              onClick={() => {}}
            />
            <NavItem
              icon={FileAudio}
              label="Audio"
              onClick={() => {}}
            />
            <NavItem
              icon={FileCode}
              label="Code"
              onClick={() => {}}
            />
          </div>
        </div>
        
        {/* Storage */}
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
            Storage
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center mb-2">
              <Cloud className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm">Storage</span>
            </div>
            
            <div className="h-2 w-full bg-gray-200 rounded-full mb-2">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${calculateUsedPercentage()}%` }}
              />
            </div>
            
            {storage ? (
              <div className="text-xs text-gray-600">
                <span>{formatBytes(storage.usedSpace)}</span>
                <span className="mx-1">of</span>
                <span>{formatBytes(storage.totalSpace)}</span>
                <span className="mx-1">used</span>
              </div>
            ) : (
              <div className="text-xs text-gray-600">
                Loading storage info...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 