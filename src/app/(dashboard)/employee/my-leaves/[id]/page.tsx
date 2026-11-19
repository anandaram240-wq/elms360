import { LeaveDetailClient } from '@/components/employee/leave-detail-client'

export default async function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LeaveDetailClient requestId={id} />
}
