import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

export default function Dashboard(){
  const data = [{name:'Mon', val:10},{name:'Tue', val:20},{name:'Wed', val:30}]
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">Total Tasks<br/><strong>42</strong></div>
        <div className="p-4 border rounded">Open Issues<br/><strong>7</strong></div>
        <div className="p-4 border rounded">New Clients<br/><strong>5</strong></div>
      </div>

      <div className="mt-6 p-4 border rounded">
        <h3 className="mb-2 font-medium">Activity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line dataKey="val" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
