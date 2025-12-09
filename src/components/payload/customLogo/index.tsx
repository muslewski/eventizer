import logo from '@/assets/eventizer-logo-1-light.png' // Make sure you have your correct images referenced here
import logoDark from '@/assets/eventizer-logo-1-dark.png' // Make sure you have your correct images referenced here
import Image from 'next/image'

export default function Logo() {
  return (
    <div>
      <Image className="h-96 object-contain dark:hidden" src={logo} alt="" />
      <Image className="h-96 object-contain hidden dark:block" src={logoDark} alt="" />
    </div>
  )
}
