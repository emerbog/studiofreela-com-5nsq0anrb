import React, { useState } from 'react'
import { ContractFormDialog } from './ContractFormDialog'

export function ContractFormSheet({ triggerAsChild }: { triggerAsChild: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        {triggerAsChild}
      </span>
      <ContractFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
