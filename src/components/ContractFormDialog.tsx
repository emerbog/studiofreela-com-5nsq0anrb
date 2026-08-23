import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppData } from '@/hooks/use-app-data'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InteractiveContractEditor } from './InteractiveContractEditor'
import { ContractDocumentViewer } from './ContractDocumentViewer'
import { Contract, ContractFormData } from '@/types'

interface ContractFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialContract?: Contract | null
  initialQuoteId?: string
  initialClientId?: string
}

export function ContractFormDialog({
  open,
  onOpenChange,
  initialContract,
  initialQuoteId,
  initialClientId,
}: ContractFormDialogProps) {
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form')
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null)
  const [previewFormData, setPreviewFormData] = useState<ContractFormData | null>(null)

  useEffect(() => {
    if (open) {
      if (initialContract && initialContract.formData) {
        setGeneratedContract(initialContract)
        setPreviewFormData(initialContract.formData)
        setViewMode('preview')
      } else {
        setViewMode('form')
        setGeneratedContract(null)
        setPreviewFormData(null)
      }
    }
  }, [open, initialContract])

  const handleGenerateSuccess = (contract: Contract, formData: ContractFormData) => {
    setGeneratedContract(contract)
    setPreviewFormData(formData)
    setViewMode('preview')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-8">
        <DialogHeader className="sr-only">
          <DialogTitle>Gerador de Contrato</DialogTitle>
        </DialogHeader>

        {viewMode === 'form' ? (
          <InteractiveContractEditor
            initialContract={initialContract}
            initialQuoteId={initialQuoteId}
            initialClientId={initialClientId}
            onGenerateSuccess={handleGenerateSuccess}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <ContractDocumentViewer
            contract={generatedContract}
            formData={previewFormData}
            onBack={() => setViewMode('form')}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
