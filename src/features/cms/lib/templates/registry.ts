import type { ComponentType } from "react"
import * as Accordion from "@/components/ui/accordion"
import * as Alert from "@/components/ui/alert"
import * as AlertDialog from "@/components/ui/alert-dialog"
import * as Avatar from "@/components/ui/avatar"
import * as Badge from "@/components/ui/badge"
import * as Button from "@/components/ui/button"
import * as Card from "@/components/ui/card"
import * as Checkbox from "@/components/ui/checkbox"
import * as Dialog from "@/components/ui/dialog"
import * as DropdownMenu from "@/components/ui/dropdown-menu"
import * as Input from "@/components/ui/input"
import * as Label from "@/components/ui/label"
import * as Select from "@/components/ui/select"
import * as Separator from "@/components/ui/separator"
import * as Sheet from "@/components/ui/sheet"
import * as Sidebar from "@/components/ui/sidebar"
import * as Table from "@/components/ui/table"
import * as Tabs from "@/components/ui/tabs"
import * as Textarea from "@/components/ui/textarea"
import * as Tooltip from "@/components/ui/tooltip"

export type ComponentProps = Record<string, unknown>

export type ComponentRegistry = Record<string, React.ComponentType<ComponentProps>>

export const componentRegistry: ComponentRegistry = {
  // UI primitives
  "ui.accordion": Accordion.Accordion,
  "ui.alert": Alert.Alert,
  "ui.alert-dialog": AlertDialog.AlertDialog,
  "ui.avatar": Avatar.Avatar,
  "ui.badge": Badge.Badge,
  "ui.button": Button.Button,
  "ui.card": Card.Card,
  "ui.checkbox": Checkbox.Checkbox,
  "ui.dialog": Dialog.Dialog,
  "ui.dropdown-menu": DropdownMenu.DropdownMenu,
  "ui.input": Input.Input,
  "ui.label": Label.Label,
  "ui.select": Select.Select,
  "ui.separator": Separator.Separator,
  "ui.sheet": Sheet.Sheet,
  "ui.sidebar": Sidebar.Sidebar,
  "ui.table": Table.Table,
  "ui.tabs": Tabs.Tabs,
  "ui.textarea": Textarea.Textarea,
  "ui.tooltip": Tooltip.Tooltip,
}
