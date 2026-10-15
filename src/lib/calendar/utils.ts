import { db } from '@/lib/db/client'
import { orderEvents, requests } from '@/lib/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'

interface CalendarEvent {
  id: string
  requestId: string
  requestCode: string
  productName: string
  type: string
  eventType: string
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  endDate: string | null
  isEstimated: boolean
  isRange: boolean
  toleranceDays: number | null
  status: string
}

interface GetCalendarEventsParams {
  startDate: string
  endDate: string
  eventType?: string
  status?: string
  requestId?: string
  limit?: number
}

export async function getCalendarEvents(userId: string, params: GetCalendarEventsParams) {
  const { startDate, endDate, eventType, status, requestId, limit = 200 } = params

  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)

  const conditions = [
    gte(orderEvents.eventDate, startDateObj),
    lte(orderEvents.eventDate, endDateObj)
  ]
  if (eventType) conditions.push(eq(orderEvents.eventType, eventType))
  if (requestId) conditions.push(eq(orderEvents.requestId, requestId))
  if (status) conditions.push(eq(requests.status, status))

  const data = await db.select({
    id: orderEvents.id,
    requestId: orderEvents.requestId,
    requestCode: requests.requestCode,
    productName: requests.productName,
    type: requests.type,
    eventType: orderEvents.eventType,
    title: orderEvents.title,
    description: orderEvents.description,
    eventDate: orderEvents.eventDate,
    startTime: orderEvents.startTime,
    endTime: orderEvents.endTime,
    endDate: orderEvents.endDate,
    isEstimated: orderEvents.isEstimated,
    isRange: orderEvents.isRange,
    toleranceDays: orderEvents.toleranceDays,
    status: requests.status,
  })
    .from(orderEvents)
    .innerJoin(requests, eq(orderEvents.requestId, requests.id))
    .where(and(...conditions))
    .orderBy(asc(orderEvents.eventDate), asc(orderEvents.startTime))
    .limit(limit)

  const events = data.map((e) => ({
    ...e,
    eventDate: e.eventDate.toISOString().split('T')[0],
    startTime: e.startTime ? e.startTime.toISOString().split('T')[1].substring(0, 8) : null,
    endTime: e.endTime ? e.endTime.toISOString().split('T')[1].substring(0, 8) : null,
    endDate: e.endDate ? e.endDate.toISOString().split('T')[0] : null,
    isEstimated: e.isEstimated ?? false,
    isRange: e.isRange ?? false,
  }))

  const byDate = events.reduce((acc, event) => {
    const key = event.eventDate
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  const summary = Object.entries(byDate).reduce((acc, [date, eventsOfDate]) => {
    const types: Record<string, number> = {}
    eventsOfDate.forEach((e) => {
      types[e.eventType] = (types[e.eventType] || 0) + 1
    })
    return { ...acc, [date]: { count: eventsOfDate.length, types } }
  }, {} as Record<string, { count: number; types: Record<string, number> }>)

  return {
    events,
    byDate,
    summary,
    range: { start: params.startDate, end: params.endDate },
    filters: { eventType: params.eventType, status: params.status, requestId: params.requestId }
  }
}