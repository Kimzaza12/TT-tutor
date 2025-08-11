import Link from "next/link"

const login = () => {
  return (
    <>
     <div className="flex justify-center content-center min-h-[calc(105dvh-64px)]">
        <div className="flex flex-col justify-center px-6 py-12 lg:px-8 w-500" >
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img src="./image/test.jpg" alt="Your Company" className="mx-auto h-10 w-auto" />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">LOGIN เพื่อสมัครเรียน</h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form action="#" method="POST" className="space-y-6">
              <div>
                <label form="email" className="block text-sm/6 font-medium text-gray-900">Email ของมึง</label>
                <div className="mt-2">
                  <input id="email" type="email" name="email" required autoComplete="email" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label form="password" className="block text-sm/6 font-medium text-gray-900">Password ของมึง</label>
                  <div className="text-sm">
                    <Link href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">มึงลืม password หรอ ?</Link>
                  </div>
                </div>
                <div className="mt-2">
                  <input id="password" type="password" name="password" required autoComplete="current-password" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                </div>
              </div>

              <div>
                <button type="submit" className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
              </div>
            </form>

          </div>
        </div>
     </div>
    </>

  )
}
export default login