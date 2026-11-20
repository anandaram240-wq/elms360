import * as React from 'react'
import { notFound } from 'next/navigation'
import { getLeaveRequestDetail } from '@/app/actions/manager/approval-actions'
import { ApprovalDetailView } from '@/components/manager/approval-detail-view'

export const dynamic = 'force-dynamic'

export default async function ManagerApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let data: any = null

  try {
    data = await getLeaveRequestDetail(id)
  } catch (err) {
    console.error('Failed to load leave request detail:', err)
    notFound()
  }

  if (!data) {
    notFound()
  }

  return <ApprovalDetailView data={data} />
}
