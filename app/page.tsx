// rafce
// rfce

import Link from "next/link"

const page = async () => {
  return (
    <>
      <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl">
        <div className="md:flex">
          <div className="md:shrink-0">
            <img src=""  />
          </div>
          <div className="p-8">
            <div className="text-sm font-semibold tracking-wide text-indigo-500 uppercase">Mr.Sitichai Kim</div>
            <a href="#" className="mt-1 block text-lg leading-tight font-medium text-black hover:underline">
              เบื่อเกี๋ยวอยากเคี้ยวตีน เบื่อส้มตำอยากหม่ำส้นตีน
            </a>
            <p className="mt-2 text-gray-500">
              ความรักก็เหมือนต้นมะละกอ ถ้าเราปลูกต้นมะละกอเราก็เอาไปให้คนที่เรารักเขาก็จะรักเราเหมือนกับต้นมะละกอ
            </p>
          </div>
        </div>
      </div>
    </>

  )
}
export default page