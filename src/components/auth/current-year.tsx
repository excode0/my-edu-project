"use client"

import { use } from "react"
import { io } from "next/cache"

export function CurrentYear() {
  use(io())
  return <>{new Date().getFullYear()}</>
}
