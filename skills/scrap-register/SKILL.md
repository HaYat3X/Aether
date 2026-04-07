---
name: scrap-register
description: 整理済みのコンテンツをNotionのスクラップDBに登録する内部スキル。他のスキル（scrap-url / scrap-text）から呼び出される。ユーザーが直接トリガーすることは想定しない。
---

## 概要

タイトル・概要・種類などの整理済みデータを受け取り、Notion のスクラップDB（TGP - スクラップ）にページを作成する。

## 使用条件

scrap-url または scrap-text スキルの内部処理として呼び出される。
