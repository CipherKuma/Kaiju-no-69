"use client"

import { useNotifications } from "@/components/ui/notification"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const { showNotification } = useNotifications()

  const toast = ({ title, description, variant }: ToastProps) => {
    showNotification({
      type: variant === "destructive" ? "error" : "info",
      title: title || "",
      message: description || "",
    })
  }

  return { toast }
}