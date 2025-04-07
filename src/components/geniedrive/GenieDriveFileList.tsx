import React from 'react';
import { 
  File, Folder, FileText, FileImage, FileSpreadsheet, 
  FileCode, FileAudio, FileVideo, Presentation, 
  FileArchive, FileUp, MoreVertical, Star, StarOff
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GenieDriveItem, GenieDriveViewState } from '../../types/geniedrive';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';

interface GenieDriveFileListProps {
  items: GenieDriveItem[];
  viewState: GenieDriveViewState;
  onViewStateChange: (newState: GenieDriveViewState) => void;
  onItemSelect: (item: GenieDriveItem) => void;
  onItemClick: (item: GenieDriveItem) => void;
  selectedItem: GenieDriveItem | null;
}

export function GenieDriveFileList({
  items,
  viewState,
  onViewStateChange,
  onItemSelect,
  onItemClick,
  selectedItem
}: GenieDriveFileListProps) {
  const isItemSelected = (itemId: string) => {
    return viewState.selectedItems.includes(itemId);
  };

  const toggleItemSelection = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const selectedItems = [...viewState.selectedItems];
    const index = selectedItems.indexOf(itemId);
    
    if (index === -1) {
      selectedItems.push(itemId);
    } else {
      selectedItems.splice(index, 1);
    }
    
    onViewStateChange({
      ...viewState,
      selectedItems
    });
  };

  const toggleStarred = (item: GenieDriveItem, event: React.MouseEvent) => {
    event.stopPropagation();
    // In a real implementation, we would update the item's starred status
    console.log('Toggle starred for', item.id);
  };

  // Get the appropriate icon for a file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder className="h-5 w-5 text-blue-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-orange-600" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-purple-600" />;
      case 'video':
        return <FileVideo className="h-5 w-5 text-red-600" />;
      case 'audio':
        return <FileAudio className="h-5 w-5 text-pink-600" />;
      case 'archive':
        return <FileArchive className="h-5 w-5 text-brown-600" />;
      case 'code':
        return <FileCode className="h-5 w-5 text-gray-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If it's today, show the time
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's yesterday, show "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show the date
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render item in grid view
  const renderGridItem = (item: GenieDriveItem) => {
    const isSelected = isItemSelected(item.id);
    const isCurrent = selectedItem?.id === item.id;
    
    return (
      <div 
        key={item.id}
        className={cn(
          "border rounded-lg p-3 cursor-pointer transition-all hover:shadow relative",
          isCurrent ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300",
          isSelected ? "ring-2 ring-blue-400" : ""
        )}
        onClick={() => onItemClick(item)}
        onDoubleClick={() => onItemSelect(item)}
      >
        {/* Selection checkbox */}
        <div 
          className="absolute top-2 left-2 z-10"
          onClick={(e) => toggleItemSelection(item.id, e)}
        >
          <Checkbox checked={isSelected} />
        </div>
        
        {/* Star button */}
        <div 
          className="absolute top-2 right-2 z-10"
          onClick={(e) => toggleStarred(item, e)}
        >
          {item.metadata.starred ? (
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          ) : (
            <StarOff className="h-4 w-4 text-gray-400 opacity-50 hover:opacity-100" />
          )}
        </div>
        
        {/* File preview/icon */}
        <div className="pt-5 pb-2 flex justify-center items-center">
          {item.type === 'image' && item.previewUrl ? (
            <div className="h-20 w-20 relative">
              <img 
                src={item.previewUrl} 
                alt={item.name}
                className="h-full w-full object-cover rounded"
              />
            </div>
          ) : (
            <div className="h-20 w-20 flex items-center justify-center">
              {getFileIcon(item.type)}
            </div>
          )}
        </div>
        
        {/* File info */}
        <div className="text-center mt-2">
          <div className="font-medium text-sm truncate" title={item.name}>
            {item.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(item.metadata.lastModifiedAt)}
          </div>
        </div>
        
        {/* Actions */}
        <div className="absolute bottom-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Render item in list view
  const renderListItem = (item: GenieDriveItem) => {
    const isSelected = isItemSelected(item.id);
    const isCurrent = selectedItem?.id === item.id;
    
    return (
      <div 
        key={item.id}
        className={cn(
          "flex items-center px-3 py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
          isCurrent ? "bg-blue-50" : "",
          isSelected ? "bg-blue-50" : ""
        )}
        onClick={() => onItemClick(item)}
        onDoubleClick={() => onItemSelect(item)}
      >
        {/* Selection checkbox */}
        <div 
          className="mr-2"
          onClick={(e) => toggleItemSelection(item.id, e)}
        >
          <Checkbox checked={isSelected} />
        </div>
        
        {/* Icon */}
        <div className="mr-3">
          {getFileIcon(item.type)}
        </div>
        
        {/* Name & info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={item.name}>
            {item.name}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(item.metadata.lastModifiedAt)}
          </div>
        </div>
        
        {/* Star */}
        <div 
          className="ml-2 flex items-center"
          onClick={(e) => toggleStarred(item, e)}
        >
          {item.metadata.starred ? (
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          ) : (
            <StarOff className="h-4 w-4 text-gray-400 opacity-50 hover:opacity-100" />
          )}
        </div>
        
        {/* Size info */}
        <div className="w-24 text-right text-xs text-gray-500 ml-4">
          {item.type !== 'folder' 
            ? (item.metadata.size < 1024 
                ? `${item.metadata.size} B` 
                : `${Math.round(item.metadata.size / 1024)} KB`)
            : `${item.type === 'folder' ? (item as any).childrenCount || 0 : 0} items`
          }
        </div>
        
        {/* Actions */}
        <div className="ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // If no items found
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <Folder className="h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No items found</h3>
        <p className="text-sm text-center max-w-md">
          {viewState.filter.search 
            ? `No items match your search "${viewState.filter.search}"`
            : "This folder is empty"
          }
        </p>
        {viewState.filter.search && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onViewStateChange({
              ...viewState,
              filter: {
                ...viewState.filter,
                search: ''
              }
            })}
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  // Render the file list
  return (
    <div className={cn(
      "h-full overflow-auto",
      viewState.viewMode === 'grid' ? "p-4" : "p-0"
    )}>
      {viewState.viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(renderGridItem)}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map(renderListItem)}
        </div>
      )}
    </div>
  );
} 