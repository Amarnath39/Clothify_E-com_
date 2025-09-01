import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const CartSkeletonLoader = () => {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-7/12">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="mb-4 p-4">
              <div className="flex flex-col sm:flex-row items-start md:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Skeleton className="h-[120px] w-full sm:w-1/3 rounded-md" />
                <div className="flex-grow w-full sm:w-2/3">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex items-center mt-2">
                    <Skeleton className="h-8 w-8 rounded-md mr-2" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-8 rounded-md ml-2" />
                  </div>
                </div>
                <div className="flex flex-col items-start justify-start md:items-end space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="lg:w-5/12">
          <Card className="p-6 sticky top-4 bg-gray-50 dark:bg-gray-800">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4 mb-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 mx-auto mt-4" />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CartSkeletonLoader