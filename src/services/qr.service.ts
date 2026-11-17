'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'
import crypto from 'crypto'

export interface RoomQRCodeItem {
  id: string
  property_id: string
  room_id: string
  room_number: string
  floor_name?: string
  room_type_name?: string
  token_hash: string
  qr_code_svg?: string
  qr_code_data_url?: string
  is_active: boolean
  generated_at: string
  revoked_at?: string
  print_count: number
  last_scanned_at?: string
  scan_count: number
  guest_url: string
}

/**
 * Get the base URL for the application
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

/**
 * Generate secure random token hash
 */
function generateToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

/**
 * Fetch all rooms with their QR code status and analytics
 */
export async function getRoomQRCodes(propertyId?: string): Promise<RoomQRCodeItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      property_id,
      floor:floors(name, floor_number),
      room_type:room_types(name),
      qr:room_qr_codes(*)
    `)
    .order('room_number', { ascending: true })

  if (propertyId) {
    query = query.eq('property_id', propertyId)
  }

  const { data, error } = await query
  if (error || !data) return []

  const baseUrl = getBaseUrl()

  return data.map((room: any) => {
    const qr = Array.isArray(room.qr) && room.qr.length > 0 ? room.qr[0] : room.qr

    const token = qr?.token_hash || ''
    const guestUrl = token
      ? `${baseUrl}/guest/${room.property_id}/${room.id}?token=${token}`
      : `${baseUrl}/guest/${room.property_id}/${room.id}`

    return {
      id: qr?.id || '',
      property_id: room.property_id,
      room_id: room.id,
      room_number: room.room_number,
      floor_name: room.floor?.name || (room.floor?.floor_number ? `Floor ${room.floor.floor_number}` : 'Floor 1'),
      room_type_name: room.room_type?.name || 'Standard Room',
      token_hash: token,
      qr_code_svg: qr?.qr_code_svg || '',
      qr_code_data_url: qr?.qr_code_data_url || '',
      is_active: qr ? qr.is_active : false,
      generated_at: qr?.generated_at || '',
      revoked_at: qr?.revoked_at || undefined,
      print_count: qr?.print_count || 0,
      last_scanned_at: qr?.last_scanned_at || undefined,
      scan_count: qr?.scan_count || 0,
      guest_url: guestUrl,
    }
  })
}

/**
 * Generate or update QR code for a single room
 */
export async function generateRoomQRCode(
  propertyId: string,
  roomId: string
): Promise<{ success: boolean; data?: RoomQRCodeItem; error?: string }> {
  try {
    const supabase = await createClient()
    const token = generateToken()
    const baseUrl = getBaseUrl()
    const guestUrl = `${baseUrl}/guest/${propertyId}/${roomId}?token=${token}`

    // Generate PNG Data URL and SVG representation
    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#5e2b9d',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })

    const qrSvg = await QRCode.toString(guestUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#5e2b9d',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })

    // Upsert into room_qr_codes
    const { data, error } = await supabase
      .from('room_qr_codes')
      .upsert(
        {
          property_id: propertyId,
          room_id: roomId,
          token_hash: token,
          qr_code_data_url: qrDataUrl,
          qr_code_svg: qrSvg,
          is_active: true,
          generated_at: new Date().toISOString(),
          revoked_at: null,
          print_count: 0,
          scan_count: 0,
        },
        { onConflict: 'room_id' }
      )
      .select()
      .single()

    if (error) throw error

    revalidatePath('/rooms/qr-codes')
    revalidatePath('/rooms')
    return {
      success: true,
      data: {
        id: data.id,
        property_id: propertyId,
        room_id: roomId,
        room_number: '',
        token_hash: token,
        qr_code_svg: qrSvg,
        qr_code_data_url: qrDataUrl,
        is_active: true,
        generated_at: data.generated_at,
        print_count: 0,
        scan_count: 0,
        guest_url: guestUrl,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Bulk generate QR codes for all rooms or a selection of rooms
 */
export async function bulkGenerateRoomQRCodes(
  propertyId: string,
  roomIds?: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient()

    let roomsQuery = supabase.from('rooms').select('id').eq('property_id', propertyId)
    if (roomIds && roomIds.length > 0) {
      roomsQuery = roomsQuery.in('id', roomIds)
    }

    const { data: rooms, error } = await roomsQuery
    if (error || !rooms) throw error || new Error('No rooms found')

    let count = 0
    for (const r of rooms) {
      const res = await generateRoomQRCode(propertyId, r.id)
      if (res.success) count++
    }

    revalidatePath('/rooms/qr-codes')
    return { success: true, count }
  } catch (err: any) {
    return { success: false, count: 0, error: err.message }
  }
}

/**
 * Revoke a room's QR code (blocks guest access immediately)
 */
export async function revokeRoomQRCode(roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('room_qr_codes')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('room_id', roomId)

    if (error) throw error

    revalidatePath('/rooms/qr-codes')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Record a print action increment
 */
export async function incrementQRPrintCount(roomId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('room_qr_codes').select('print_count').eq('room_id', roomId).single()
    if (data) {
      await supabase
        .from('room_qr_codes')
        .update({ print_count: (data.print_count || 0) + 1 })
        .eq('room_id', roomId)
    }
  } catch {}
}
