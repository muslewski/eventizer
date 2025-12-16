import logo from '@/assets/eventizer-icon-1.png' // Make sure you have your correct images referenced here
import Image from 'next/image'

export default function Icon() {
  return (
    <div className="h-4.5">
      <Image className=" object-cover" fill src={logo} alt="eventizer icon" />
    </div>
  )
}
