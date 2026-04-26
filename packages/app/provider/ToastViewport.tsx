import { forwardRef } from 'react'
import { ToastViewport as ToastViewportOg } from '@my/ui'

export const ToastViewport = forwardRef<any, any>((props, ref) => {
  return (
    <ToastViewportOg
      ref={ref}
      {...props}
      top="$8"
      left={0}
      right={0}
    />
  )
})

