'use client'

import { useState } from 'react'
import { ProductPanel } from '@/components/features/pos/ProductPanel'
import { ShoppingCart } from '@/components/features/pos/ShoppingCart'
import { TotalsPanel } from '@/components/features/pos/TotalsPanel'
import { PaymentModal } from '@/components/features/pos/PaymentModal'
import { ReceiptModal } from '@/components/features/pos/ReceiptModal'
import { CustomerSelector } from '@/components/features/pos/CustomerSelector'
import { StoreSelector } from '@/components/features/pos/StoreSelector'
import { useStoreConfig } from '@/hooks/useStoreConfig'

export default function POSPage() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null)
  const { data: storeConfig } = useStoreConfig()

  const handleCheckout = () => {
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = (saleId: string) => {
    setCompletedSaleId(saleId)
    setReceiptModalOpen(true)
  }

  const taxRate = storeConfig?.taxRate || 0

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">POS</h1>
        <StoreSelector />
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Products Panel - Left Side */}
        <div className="lg:col-span-5 overflow-hidden">
          <ProductPanel />
        </div>

        {/* Cart and Totals - Right Side (50% + a bit more) */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
          {/* Cliente para la venta */}
          <CustomerSelector />
          {/* Shopping Cart */}
          <div className="flex-1 min-h-0">
            <ShoppingCart />
          </div>

          {/* Totals Panel */}
          <div className="h-auto">
            <TotalsPanel onCheckout={handleCheckout} taxRate={taxRate} />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        saleId={completedSaleId}
        open={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false)
          setCompletedSaleId(null)
        }}
      />
    </div>
  )
}

