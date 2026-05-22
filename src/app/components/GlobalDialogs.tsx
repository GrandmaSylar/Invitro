import { useDialogStore } from '../../stores/useDialogStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function GlobalDialogs() {
  const {
    confirmOpen,
    confirmOptions,
    resolveConfirm,
    closeConfirm,
    successOpen,
    successOptions,
    closeSuccess,
  } = useDialogStore();

  return (
    <>
      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${
                confirmOptions?.variant === 'destructive' 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500' 
                  : 'bg-primary/10 text-primary dark:bg-primary/20'
              }`}>
                {confirmOptions?.variant === 'destructive' ? <AlertTriangle size={20} /> : <Info size={20} />}
              </div>
              <AlertDialogTitle className="text-xl">
                {confirmOptions?.title || 'Confirm Action'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {confirmOptions?.description || 'Are you sure you want to proceed?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={closeConfirm} className="px-6">
              {confirmOptions?.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                resolveConfirm(true);
              }}
              className={`px-6 ${
                confirmOptions?.variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {confirmOptions?.confirmText || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={successOpen} onOpenChange={(open) => !open && closeSuccess()}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">
              {successOptions?.title || 'Success'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              {successOptions?.description || 'The operation was completed successfully.'}
            </AlertDialogDescription>
            <AlertDialogAction onClick={closeSuccess} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700">
              {successOptions?.actionText || 'Continue'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
