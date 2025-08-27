"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface AlertDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface AlertDialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface AlertDialogCancelProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const AlertDialog = ({ children, open, onOpenChange }: AlertDialogProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
      {children}
    </Dialog>
  )
}

const AlertDialogTrigger = ({ children, asChild, onClick }: AlertDialogTriggerProps) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement<any>(children, {
      onClick: () => {
        onClick?.()
        // Dialog trigger will handle opening
      }
    })
  }
  
  return (
    <Button variant="ghost" onClick={onClick}>
      {children}
    </Button>
  )
}

const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => {
  return (
    <DialogContent className={cn("sm:max-w-[425px]", className)}>
      {children}
    </DialogContent>
  )
}

const AlertDialogHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <DialogHeader className={className} {...props}>
      {children}
    </DialogHeader>
  )
}

const AlertDialogTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <DialogTitle className={className} {...props}>
      {children}
    </DialogTitle>
  )
}

const AlertDialogDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <DialogDescription className={className} {...props}>
      {children}
    </DialogDescription>
  )
}

const AlertDialogFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props}>
      {children}
    </div>
  )
}

const AlertDialogAction = ({ children, onClick, className }: AlertDialogActionProps) => {
  return (
    <Button onClick={onClick} className={className}>
      {children}
    </Button>
  )
}

const AlertDialogCancel = ({ children, onClick, className }: AlertDialogCancelProps) => {
  return (
    <Button variant="outline" onClick={onClick} className={cn("mt-2 sm:mt-0", className)}>
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
