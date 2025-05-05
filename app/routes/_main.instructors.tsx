"use client"

import type { LoaderFunctionArgs } from "@remix-run/node"
import { Await, useLoaderData } from "@remix-run/react"
import { Suspense } from "react"
import { Skeleton } from "~/components/ui/skeleton"
import { fetchTeachers } from "~/lib/services/account"
import type { TeacherDetail } from "~/lib/types/account/account"
import Image from "~/components/ui/image"
import { useSearchParams } from "@remix-run/react"
import PaginationBar from "~/components/ui/pagination-bar"
import type { PaginationMetaData } from "~/lib/types/pagination-meta-data"
import { motion } from "framer-motion"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get("page")) || 1
  const pageSize = Number(url.searchParams.get("pageSize")) || 10

  const promise = fetchTeachers({ page, pageSize }).then((response) => {
    const headers = response.headers
    const metadata: PaginationMetaData = {
      page: Number.parseInt(headers["x-page"] || "1"),
      pageSize: Number.parseInt(headers["x-page-size"] || "10"),
      totalPages: Number.parseInt(headers["x-total-pages"] || "1"),
      totalCount: Number.parseInt(headers["x-total-count"] || "0"),
    }

    return { teachers: response.data as TeacherDetail[], totalPages: metadata.totalPages, currentPage: page }
  })

  return { promise }
}

export default function TeachersShowcasePage() {
  const { promise } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sky background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-blue-50 z-0"></div>

      {/* Decorative clouds using Framer Motion */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-24 bg-white rounded-full opacity-70 blur-md z-10"
        animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      ></motion.div>

      <motion.div
        className="absolute top-40 right-20 w-80 h-32 bg-white rounded-full opacity-80 blur-md z-10"
        animate={{ x: [0, -15, 0], y: [0, 8, 0] }}
        transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      ></motion.div>

      <motion.div
        className="absolute bottom-40 left-1/4 w-72 h-28 bg-white rounded-full opacity-60 blur-md z-10"
        animate={{ x: [0, 12, 0], y: [0, -7, 0] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      ></motion.div>

      <motion.div
        className="absolute top-1/3 right-1/3 w-56 h-20 bg-white rounded-full opacity-50 blur-md z-10"
        animate={{ x: [0, -10, 0], y: [0, 5, 0] }}
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      ></motion.div>

      {/* Sun rays with subtle pulsing animation */}
      <motion.div
        className="absolute top-10 right-10 w-40 h-40 bg-yellow-200 rounded-full opacity-40 blur-lg z-10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      ></motion.div>

      {/* Floating music notes with Framer Motion */}
      <motion.div
        className="absolute top-1/4 left-1/5 text-4xl text-sky-700 opacity-30 z-10"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        ♪
      </motion.div>

      <motion.div
        className="absolute top-2/3 right-1/4 text-5xl text-sky-800 opacity-20 z-10"
        animate={{ y: [0, -20, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        ♫
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 left-1/3 text-3xl text-sky-600 opacity-25 z-10"
        animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        ♩
      </motion.div>

      {/* Content container */}
      <div className="relative z-20 container mx-auto px-4 py-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-extrabold mb-4 text-sky-900 drop-shadow-lg">Meet Our Inspiring Teachers</h2>
          <p className="text-xl italic text-sky-700 max-w-2xl mx-auto">
            Our talented instructors bring music to life with passion and expertise, guiding students to reach new
            heights in their musical journey.
          </p>
        </motion.div>

        <Suspense fallback={<LoadingSkeleton />}>
          <Await resolve={promise}>
            {({ teachers, totalPages, currentPage }) => (
              <motion.div
                className="space-y-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {teachers.length > 0 ? (
                    teachers.map((teacher, index) => (
                      <TeacherCard key={teacher.accountFirebaseId} teacher={teacher} index={index} />
                    ))
                  ) : (
                    <motion.div
                      className="col-span-full text-center py-12"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-xl">
                        <p className="text-sky-800 text-lg">No teachers are currently available.</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <motion.div
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="bg-white/70 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                    <PaginationBar currentPage={currentPage} totalPages={totalPages} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </Await>
        </Suspense>
      </div>
    </div>
  )
}

function TeacherCard({ teacher, index }: { teacher: TeacherDetail; index: number }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      {/* Card with glass effect */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-sky-300/50">
        {/* Top decorative wave */}
        <div className="h-16 bg-gradient-to-r from-sky-400 to-blue-500 rounded-t-2xl"></div>

        <div className="px-6 pt-0 pb-6 relative">
          {/* Avatar */}
          <motion.div
            className="flex justify-center -mt-12"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="ring-4 ring-white rounded-full overflow-hidden shadow-lg">
              <Image
                src={teacher.avatarUrl || "/images/noavatar.png"}
                alt={teacher.fullName}
                className="w-28 h-28 object-cover"
              />
            </div>
          </motion.div>

          {/* Teacher info */}
          <div className="text-center mt-4 space-y-2">
            <h4 className="text-xl font-bold text-sky-900">{teacher.fullName || teacher.userName}</h4>

            <div className="inline-block bg-sky-100 px-3 py-1 rounded-full text-sky-700 font-medium text-sm">
              {teacher.level?.name || "Level not specified"}
            </div>

            <div className="pt-3 space-y-1 text-sky-800">
              <p className="flex items-center justify-center gap-2">
                <span className="text-sky-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                {teacher.phone || "No phone provided"}
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-sky-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                {teacher.email || "No email provided"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative floating notes (visible on hover) */}
      <motion.div
        className="absolute -top-2 -right-2 text-sky-500 text-xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1, y: -5, rotate: 10 }}
        transition={{ duration: 0.3 }}
      >
        ♪
      </motion.div>

      <motion.div
        className="absolute -bottom-1 -left-1 text-sky-600 text-lg"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1, y: 5, rotate: -5 }}
        transition={{ duration: 0.3 }}
      >
        ♫
      </motion.div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[...Array(8)].map((_, index) => (
        <motion.div
          key={index}
          className="bg-white/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Skeleton className="h-16 rounded-t-2xl bg-sky-200/50" />
          <div className="px-6 pt-0 pb-6">
            <div className="flex justify-center -mt-12">
              <Skeleton className="w-28 h-28 rounded-full bg-sky-100/70" />
            </div>
            <div className="mt-4 space-y-3 flex flex-col items-center">
              <Skeleton className="h-6 w-3/4 rounded-full bg-sky-100/70" />
              <Skeleton className="h-5 w-1/2 rounded-full bg-sky-100/70" />
              <Skeleton className="h-4 w-4/5 rounded-full bg-sky-100/70 mt-2" />
              <Skeleton className="h-4 w-3/4 rounded-full bg-sky-100/70" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
