import { UserButton, useUser } from '@clerk/nextjs'
import { Icon, ListTree, Menu, PackagePlus, ShoppingBasket, Warehouse, X  , HandHeart , Receipt , LayoutDashboard, ShoppingCart} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { checkAndAddAssociation } from '../actions'
import Stock from './Stock'

const Navbar = () => {
    const { user } = useUser()

    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    const navLinks = [
        { href: "/", label: "Tableau de Bord", icon: LayoutDashboard },
        { href: "/products", label: "Produits", icon: ShoppingBasket },
        { href: "/new-product", label: "Nouveau produit", icon: PackagePlus },
        { href: "/category", label: "Catégories", icon: ListTree },
        { href: "/give", label: "Sorties", icon: HandHeart },
        { href: "/transactions", label: "Transactions", icon: Receipt }
    ]

    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress && user.fullName) {
            checkAndAddAssociation(user?.primaryEmailAddress?.emailAddress, user.fullName)
        }
    }, [user])


    const renderLinks = (baseClass: string) => (
        <>
            {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                const activeClass = isActive ? 'btn-primary' : 'btn-ghost'
                return (
                    <Link
                        href={href}
                        key={href}
                        className={`${baseClass} ${activeClass} btn-sm flex gap-2 items-center`}
                    >
                        <Icon className='w-4 h-4' />
                        {label}
                    </Link>
                )

            })}

            <button className="btn btn-sm"
                onClick={() => (document.getElementById('my_modal_stock') as HTMLDialogElement).showModal()}>
                <Warehouse className='w-4 h-4' />
                Alimenter le stock
            </button>
        </>
    )

    return (
        <div className='border-b border-base-300 px-5 md:px-[10%] py-4 relative'>
            <div className='flex justify-between items-center'>
                <div className='flex items-center'>
                    <div className='p-2'>
                        <ShoppingCart size={16} strokeWidth={2.75} className='w-6 h-6 text-primary' />
                    </div>
                    <span className='font-bold  text-xl'>
                        GestiShop
                    </span>
                </div>

                <button
                    className='btn w-fit sm:hidden btn-sm'
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <Menu className='w-4 h-4' />
                </button>

                <div className='hidden space-x-2 sm:flex items-center'>
                    {renderLinks("btn")}
                    <UserButton />
                </div>
            </div>

            <div className={`absolute top-0 w-full bg-base-100 h-screen flex flex-col gap-2 p-4 
                transition-all duration-300 sm:hidden z-50 ${menuOpen ? "left-0" : "-left-full"} `}>
                <div className='flex justify-between'>
                    <UserButton />
                    <button
                        className='btn w-fit sm:hidden btn-sm'
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <X className='w-4 h-4' />
                    </button>
                </div>
                {renderLinks("btn")}
            </div>

            <Stock/>
        </div>
    )
}

export default Navbar