'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full h-fit bg-linear-br from-[#1A1A1A] to-[#0A0A0A] flex flex-col">
      {/* Main content */}
      <div className="flex gap-16 justify-between">
        {/* Left part */}
        <div className="h-64 w-64 bg-green-200"></div>

        {/* Right Part */}
        <div className="h-64 w-96 bg-blue-200 flex gap-16">
          <div>
            <h3 className="font-bebas">O serwisie</h3>
            <ul>
              <li>
                <Link href="/o-nas">O Nas</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* line */}
      <hr className="w-full border-t border-yellow-500/20" />

      {/* bottom part */}
    </footer>
  )
}
