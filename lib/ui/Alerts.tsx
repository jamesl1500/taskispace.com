/**
 * Alerts UI components and utilities.
 * 
 * This module provides alert components and helper functions
 * for displaying alerts in the application.
 * 
 * @module lib/ui/Alerts
 */
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"

const ShowAlert = (message: string, type: string) => {
  if(type === 'success') {
    return (
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    )
  } else if(type === 'error') {
    return (
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
}

export { ShowAlert }