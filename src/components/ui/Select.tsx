import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../../lib/utils";

// Improved Select Root component that supports value and onValueChange
interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ children, value, onValueChange, defaultValue, ...props }, ref) => {
    return (
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
      >
        <div ref={ref} className="select-container" {...props}>
          {children}
        </div>
      </SelectPrimitive.Root>
    );
  }
);
Select.displayName = "Select";

const SelectGroup = SelectPrimitive.Group;

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectValue = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Value>, SelectValueProps>(
  ({ placeholder, className }, ref) => {
    return (
      <SelectPrimitive.Value 
        ref={ref} 
        placeholder={placeholder}
        className={cn("select-value", className)}
      />
    );
  }
);
SelectValue.displayName = "SelectValue";

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn("select-trigger", className)}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, SelectContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn("select-content", className)}
          position="popper"
          {...props}
        >
          <SelectPrimitive.Viewport className="select-viewport">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  }
);
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ value, children, className, ...props }, ref) => {
    return (
      <SelectPrimitive.Item
        ref={ref}
        value={value}
        className={cn("select-item", className)}
        {...props}
      >
        <SelectPrimitive.ItemIndicator className="select-item-indicator">
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
        <SelectPrimitive.ItemText className="select-item-text">
          {children}
        </SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    );
  }
);
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}; 