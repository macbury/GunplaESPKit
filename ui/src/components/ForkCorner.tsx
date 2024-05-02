import React from "react"
import classes from "./ForkCorner.module.css"
import { IconBrandGitlab } from "@tabler/icons-react"
import { Tooltip } from "@mantine/core"

export const REPO_URL = "https://gitlab.com/macbury/gunplaespkit"

export default function ForkCorner() {
  return (
    <>
      <Tooltip label="Fork me on gitlab">
        <a href={REPO_URL} target="_blank" className={classes.forkCorner}>
          <div><IconBrandGitlab color="white" size="54" /></div>
        </a>
      </Tooltip>
      <div className={classes.forkCornerBg} />
    </>
  )
}
