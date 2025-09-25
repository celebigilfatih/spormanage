import * as React from 'react'

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => {
  const baseClasses = 'relative w-full rounded-lg border p-4'
  const combinedClasses = `${baseClasses} ${className}`.trim()
  
  return (
    <div
      ref={ref}
      role='alert'
      className={combinedClasses}
      {...props}
    />
  )
})
Alert.displayName = 'Alert'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => {
  const baseClasses = 'text-sm leading-relaxed'
  const combinedClasses = `${baseClasses} ${className}`.trim()
  
  return (
    <div
      ref={ref}
      className={combinedClasses}
      {...props}
    />
  )
})
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }