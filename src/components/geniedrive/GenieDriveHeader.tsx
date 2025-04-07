import React from 'react';
import { 
  ChevronRight, Grid, List, SlidersHorizontal, Upload, FolderPlus, Search, 
  ArrowUpAZ, ArrowDownAZ, Clock, ArrowUp, ArrowDown, SortAsc,
  File, Image, FileVideo, Music, Archive, FileCode, Files
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GenieDriveViewState } from '../../types/geniedrive';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

interface GenieDriveHeaderProps {
  viewState: GenieDriveViewState;
  onViewStateChange: (newState: GenieDriveViewState) => void;
  onUploadClick: () => void;
  onCreateFolderClick?: () => void;
}

export function GenieDriveHeader({
  viewState,
  onViewStateChange,
  onUploadClick,
  onCreateFolderClick
}: GenieDriveHeaderProps) {
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    onViewStateChange({
      ...viewState,
      filter: {
        ...viewState.filter,
        search
      }
    });
  };

  // Handle view mode change (grid/list)
  const handleViewModeChange = (mode: 'grid' | 'list' | 'compact') => {
    onViewStateChange({
      ...viewState,
      viewMode: mode
    });
  };

  // Handle sort option change
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-') as [any, 'asc' | 'desc'];
    onViewStateChange({
      ...viewState,
      sortOptions: {
        field,
        direction
      }
    });
  };

  // Render breadcrumb navigation
  const renderBreadcrumbs = () => {
    // Start with root (My Drive)
    const breadcrumbs = [
      <button
        key="root" 
        className="text-blue-600 hover:underline"
        onClick={() => onViewStateChange({
          ...viewState,
          currentFolderId: null,
          path: []
        })}
      >
        My Drive
      </button>
    ];
    
    // Add path segments
    viewState.path.forEach((segment, index) => {
      // Add separator
      breadcrumbs.push(
        <ChevronRight key={`sep-${index}`} className="h-4 w-4 text-gray-400" />
      );
      
      breadcrumbs.push(
        <span key={`segment-${index}`} className="text-gray-600">
          {segment}
        </span>
      );
    });
    
    return breadcrumbs;
  };

  return (
    <div className="bg-white border-b p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {/* Breadcrumb navigation */}
        <div className="flex items-center space-x-1 text-sm">
          {renderBreadcrumbs()}
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            onClick={onUploadClick}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCreateFolderClick}
            className="flex items-center"
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            New Folder
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative w-80">
          <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search files..."
            className="pl-8"
            value={viewState.filter.search || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* View options */}
        <div className="flex items-center gap-1">
          {/* Sort options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SortAsc className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-1">
              <DropdownMenuItem onClick={() => handleSortChange('name-asc')} className="px-2 py-1 h-8">
                <ArrowUpAZ className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('name-desc')} className="px-2 py-1 h-8">
                <ArrowDownAZ className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('createdAt-desc')} className="px-2 py-1 h-8">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <ArrowDown className="h-3 w-3" />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('createdAt-asc')} className="px-2 py-1 h-8">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <ArrowUp className="h-3 w-3" />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('size-desc')} className="px-2 py-1 h-8">
                <ArrowDown className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('size-asc')} className="px-2 py-1 h-8">
                <ArrowUp className="h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View modes */}
          <div className="border rounded-md flex">
            <Button
              variant={viewState.viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 w-8"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewState.viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('list')}
              className="h-8 w-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filter button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-1">
              <DropdownMenuItem className="px-2 py-1 h-8">
                <Files className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 h-8">
                <File className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 h-8">
                <Image className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 h-8">
                <FileVideo className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 h-8">
                <Music className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 h-8">
                <Archive className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 h-8">
                <FileCode className="h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 