import logo from '@/assets/eventizer-icon-1.png' // Make sure you have your correct images referenced here
import Image from 'next/image'

export default function Icon() {
  return (
    <div>
      <Image className="w-40 object-cover overflow-visible" src={logo} alt="eventizer icon" />
    </div>
  )
}
